import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // `.claude/` is agent tooling (skill scripts), not project source: plain Node
  // utilities outside the TS build, verified by running them rather than by the
  // TypeScript rules below. `site/` and `server/` have their own ESLint configs.
  { ignores: ['dist/', 'coverage/', 'data/', 'site/', 'server/', '.claude/'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
