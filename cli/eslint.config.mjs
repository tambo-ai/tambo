/** @type {import("@typescript-eslint/utils").TSESLint.FlatConfig.ConfigArray} */

import eslint from "@eslint/js";
import reactConfig from "@tambo-ai/eslint-config/react-internal";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**/*",
      "esm/**/*",
      "jest.config.ts",
      "jest.config.react.ts",
      "eslint.config.mjs",
      "tests/**/*",
      "__tests__/**/*",
    ],
  },
  reactConfig,
  eslint.configs.recommended,
  tseslint.configs.stylisticTypeChecked,

  {
    rules: {
      // disable console.log but allow console.error and console.warn
      "no-console": ["error", { allow: ["error", "warn", "log"] }],
      "no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": "error",
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
      globals: {
        console: true,
        crypto: true,
        setTimeout: true,
        // Jest globals
        jest: true,
        describe: true,
        it: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
