#!/usr/bin/env bash
#
# Deploy the help-desk chat server to AWS Lambda behind a public function URL,
# and (optionally) point the Amplify-hosted site at it.
#
# Why Lambda: the site is static on Amplify Hosting, which cannot run the
# server, and the help desk sees a handful of questions a day — a function
# that scales to zero costs nothing idle. The server is an ordinary Node HTTP
# server, so it runs unchanged under the AWS Lambda Web Adapter layer, which
# turns function-URL requests into plain HTTP on a local port.
#
# Idempotent: creates the role, function and URL on the first run, updates the
# code and configuration on every later run. Safe to re-run after any failure.
#
# Usage (from the repo root, after `pnpm --filter chat-server build`):
#
#   GEMINI_API_KEY=… server/deploy/aws-lambda.sh [--amplify-app <appId>]
#
# Environment:
#   AWS_REGION / AWS_DEFAULT_REGION   required (where the function lives)
#   GEMINI_API_KEY                    required — stored on the function, never in git
#   GEMINI_MODEL                      optional model override
#   CHAT_ALLOWED_ORIGIN               comma-separated site origins for CORS. With
#                                     --amplify-app it defaults to the app's
#                                     production-branch and custom domains.
#   CHAT_FUNCTION_NAME                default psn-chat-server
#   CHAT_RESERVED_CONCURRENCY         default 2 — caps parallel instances so the
#                                     in-memory rate limit stays meaningful
#   LWA_LAYER_VERSION                 Lambda Web Adapter layer version, default 25
#
# --amplify-app <appId>: merges VITE_CHAT_API_URL=<function url> into the app's
# environment variables (preserving the others) and starts a release build of
# the production branch so the live site picks up the API.
set -euo pipefail

FUNCTION_NAME="${CHAT_FUNCTION_NAME:-psn-chat-server}"
ROLE_NAME="${FUNCTION_NAME}-role"
RUNTIME="nodejs22.x"
LWA_LAYER_VERSION="${LWA_LAYER_VERSION:-25}"
RESERVED_CONCURRENCY="${CHAT_RESERVED_CONCURRENCY:-2}"
AMPLIFY_APP_ID=""

while [ $# -gt 0 ]; do
  case "$1" in
    --amplify-app) AMPLIFY_APP_ID="$2"; shift 2 ;;
    -h|--help) sed -n '2,38p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-}}"
[ -n "$REGION" ] || { echo "AWS_REGION is not set" >&2; exit 2; }
export AWS_DEFAULT_REGION="$REGION"
[ -n "${GEMINI_API_KEY:-}" ] || { echo "GEMINI_API_KEY is not set" >&2; exit 2; }

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BUNDLE="$ROOT/server/dist/index.js"
[ -f "$BUNDLE" ] || { echo "missing $BUNDLE — run: pnpm --filter chat-server build" >&2; exit 2; }

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
LAYER_ARN="arn:aws:lambda:${REGION}:753240598075:layer:LambdaAdapterLayerX86:${LWA_LAYER_VERSION}"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

log() { printf '\n== %s\n' "$*"; }

# ---------------------------------------------------------------------------
# Amplify lookup (first, so CHAT_ALLOWED_ORIGIN can default to the site's domains)
# ---------------------------------------------------------------------------
if [ -n "$AMPLIFY_APP_ID" ] && [ -z "${CHAT_ALLOWED_ORIGIN:-}" ]; then
  log "Reading Amplify app $AMPLIFY_APP_ID for its domains"
  APP_JSON="$(aws amplify get-app --app-id "$AMPLIFY_APP_ID" --query app --output json)"
  PROD_BRANCH="$(echo "$APP_JSON" | python3 -c 'import json,sys; a=json.load(sys.stdin); print((a.get("productionBranch") or {}).get("branchName") or "main")')"
  DEFAULT_DOMAIN="$(echo "$APP_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["defaultDomain"])')"
  ORIGINS="https://${PROD_BRANCH}.${DEFAULT_DOMAIN}"
  CUSTOM="$(aws amplify list-domain-associations --app-id "$AMPLIFY_APP_ID" \
    --query 'domainAssociations[].[domainName, subDomains[].subDomainSetting.prefix]' --output json |
    python3 -c '
import json,sys
out=[]
for domain, prefixes in json.load(sys.stdin):
    for p in prefixes:
        out.append("https://" + (f"{p}.{domain}" if p else domain))
print(",".join(out))')"
  [ -n "$CUSTOM" ] && ORIGINS="${ORIGINS},${CUSTOM}"
  CHAT_ALLOWED_ORIGIN="$ORIGINS"
  echo "allowed origins: $CHAT_ALLOWED_ORIGIN"
fi

# ---------------------------------------------------------------------------
# IAM role: Lambda assumes it; only CloudWatch Logs permissions.
# ---------------------------------------------------------------------------
if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  log "Role $ROLE_NAME exists"
else
  log "Creating role $ROLE_NAME"
  aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]
  }' >/dev/null
  aws iam attach-role-policy --role-name "$ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  # IAM is eventually consistent; a brand-new role can't be assumed for a few seconds.
  echo "waiting for the role to propagate"; sleep 10
fi

# ---------------------------------------------------------------------------
# Package: the server bundle plus the shell wrapper the Web Adapter runs.
# ---------------------------------------------------------------------------
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
# The bundle is ESM; `.mjs` says so without needing a package.json in the zip.
cp "$BUNDLE" "$WORK/index.mjs"
printf '#!/bin/bash\nexec node index.mjs\n' > "$WORK/run.sh"
chmod +x "$WORK/run.sh"
(cd "$WORK" && zip -q -X function.zip index.mjs run.sh)
ZIP="fileb://$WORK/function.zip"

# The adapter forwards to the port the server listens on; readiness waits on /api/health.
ENV_JSON="$(python3 - "$GEMINI_API_KEY" "${GEMINI_MODEL:-}" "${CHAT_ALLOWED_ORIGIN:-}" <<'PY'
import json, sys
key, model, origins = sys.argv[1:4]
env = {
    "AWS_LAMBDA_EXEC_WRAPPER": "/opt/bootstrap",
    "AWS_LWA_PORT": "8080",
    "AWS_LWA_READINESS_CHECK_PATH": "/api/health",
    "PORT": "8080",
    "GEMINI_API_KEY": key,
}
if model: env["GEMINI_MODEL"] = model
if origins: env["CHAT_ALLOWED_ORIGIN"] = origins
print(json.dumps({"Variables": env}))
PY
)"

# ---------------------------------------------------------------------------
# Function: create or update, then wait for each change to settle.
# ---------------------------------------------------------------------------
if aws lambda get-function --function-name "$FUNCTION_NAME" >/dev/null 2>&1; then
  log "Updating code of $FUNCTION_NAME"
  aws lambda update-function-code --function-name "$FUNCTION_NAME" --zip-file "$ZIP" >/dev/null
  aws lambda wait function-updated --function-name "$FUNCTION_NAME"
  log "Updating configuration of $FUNCTION_NAME"
  aws lambda update-function-configuration --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" --handler run.sh --role "$ROLE_ARN" \
    --timeout 60 --memory-size 512 --layers "$LAYER_ARN" \
    --environment "$ENV_JSON" >/dev/null
  aws lambda wait function-updated --function-name "$FUNCTION_NAME"
else
  log "Creating $FUNCTION_NAME"
  aws lambda create-function --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" --handler run.sh --role "$ROLE_ARN" \
    --timeout 60 --memory-size 512 --layers "$LAYER_ARN" \
    --environment "$ENV_JSON" --zip-file "$ZIP" \
    --description "PSN stats help desk: Gemini proxy for /api/chat" >/dev/null
  aws lambda wait function-active --function-name "$FUNCTION_NAME"
fi

aws lambda put-function-concurrency --function-name "$FUNCTION_NAME" \
  --reserved-concurrent-executions "$RESERVED_CONCURRENCY" >/dev/null

# ---------------------------------------------------------------------------
# Public function URL. The server does its own CORS, so none is configured here.
# ---------------------------------------------------------------------------
if ! aws lambda get-function-url-config --function-name "$FUNCTION_NAME" >/dev/null 2>&1; then
  log "Creating function URL"
  aws lambda create-function-url-config --function-name "$FUNCTION_NAME" --auth-type NONE >/dev/null
fi
aws lambda add-permission --function-name "$FUNCTION_NAME" \
  --statement-id FunctionURLAllowPublicAccess --action lambda:InvokeFunctionUrl \
  --principal '*' --function-url-auth-type NONE >/dev/null 2>&1 || true

FUNCTION_URL="$(aws lambda get-function-url-config --function-name "$FUNCTION_NAME" --query FunctionUrl --output text)"
FUNCTION_URL="${FUNCTION_URL%/}"
log "Function URL: $FUNCTION_URL"

log "Health check"
for attempt in 1 2 3 4 5 6; do
  if curl -fsS --max-time 30 "$FUNCTION_URL/api/health"; then echo; break; fi
  [ "$attempt" -lt 6 ] || { echo "health check failed" >&2; exit 1; }
  sleep 5
done

# ---------------------------------------------------------------------------
# Amplify: point the site at the API and rebuild it.
# ---------------------------------------------------------------------------
if [ -n "$AMPLIFY_APP_ID" ]; then
  log "Setting VITE_CHAT_API_URL on Amplify app $AMPLIFY_APP_ID"
  # update-app replaces the whole map, so merge with what is there.
  MERGED="$(aws amplify get-app --app-id "$AMPLIFY_APP_ID" --query 'app.environmentVariables' --output json |
    python3 -c "import json,sys; e=json.load(sys.stdin) or {}; e['VITE_CHAT_API_URL']=sys.argv[1]; print(json.dumps(e))" "$FUNCTION_URL")"
  aws amplify update-app --app-id "$AMPLIFY_APP_ID" --environment-variables "$MERGED" >/dev/null
  PROD_BRANCH="${PROD_BRANCH:-$(aws amplify get-app --app-id "$AMPLIFY_APP_ID" --query 'app.productionBranch.branchName' --output text)}"
  [ "$PROD_BRANCH" != "None" ] || PROD_BRANCH=main
  log "Starting a release build of branch $PROD_BRANCH"
  aws amplify start-job --app-id "$AMPLIFY_APP_ID" --branch-name "$PROD_BRANCH" --job-type RELEASE \
    --query 'jobSummary.{jobId:jobId,status:status}' --output table
  echo "The help desk goes live on the site when that build finishes."
fi

log "Done"
echo "API: $FUNCTION_URL/api/chat"
