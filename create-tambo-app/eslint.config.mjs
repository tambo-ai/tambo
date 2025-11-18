/** @type {import("@typescript-eslint/utils").TSESLint.FlatConfig.ConfigArray} */

import eslint from "@eslint/js";
import config from "@tambo-ai/eslint-config/base";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**/*"] },
  config,
  eslint.configs.recommended,
  {
    rules: {
      // disable console.log but allow console.error and console.warn
      "no-console": ["error", { allow: ["error", "warn", "log"] }],
    },
    languageOptions: {
      globals: {
        process: true,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
