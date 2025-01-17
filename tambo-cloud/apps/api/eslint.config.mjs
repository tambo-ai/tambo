import { config } from '@use-hydra-ai/eslint-config/base';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      // Temporarily turning this off to reduce noise
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
