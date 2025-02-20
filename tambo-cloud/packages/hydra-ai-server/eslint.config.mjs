import config from "@use-hydra-ai/eslint-config/base";

export default [
  ...config,
  {
    rules: {
      // TODO: remove this once this package has been updated
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
