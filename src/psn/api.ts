/**
 * psn-api ships CJS for Node ("main") and ESM for bundlers ("module").
 * Under Node's CJS interop the minified build defeats static named-export
 * detection, so `import { x } from 'psn-api'` crashes at runtime while the
 * same line works in bundler contexts (vitest, tsup). Normalize through the
 * namespace object so both runtimes resolve the same functions.
 */
import * as psnApiNamespace from 'psn-api';

type PsnApi = typeof psnApiNamespace;

const candidate = psnApiNamespace as PsnApi & { default?: PsnApi };
export const psnApi: PsnApi = candidate.default ?? candidate;
