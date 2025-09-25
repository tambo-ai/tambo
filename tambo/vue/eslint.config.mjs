/** @type {import("@typescript-eslint/utils").TSESLint.FlatConfig.ConfigArray} */

import eslint from "@eslint/js";
import config from "@tambo-ai/eslint-config/base";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";

export default tseslint.config(
  { ignores: ["dist/**/*", "esm/**/*", "eslint.config.mjs"] },
  config,
  eslint.configs.recommended,
  tseslint.configs.stylisticTypeChecked,
  vue.configs["flat/recommended"],
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": ["error", { allow: ["error", "warn"] }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
      globals: {
        crypto: true,
        console: true,
      },
    },
  },
);

