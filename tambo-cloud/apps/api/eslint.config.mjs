import config from '@use-hydra-ai/eslint-config/base';
import tseslint from 'typescript-eslint';

export default tseslint.config(...config, {
  rules: {
    // Temporarily turning this off to reduce noise
    '@typescript-eslint/no-explicit-any': 'off',
  },
});
