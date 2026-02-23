/** @type {import("@typescript-eslint/utils").TSESLint.FlatConfig.ConfigArray} */

import eslint from "@eslint/js";
import config from "@tambo-ai/eslint-config/base";
import jsdoc from "eslint-plugin-jsdoc";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**/*",
      "esm/**/*",
      "jest.config.ts",
      "eslint.config.mjs",
      "coverage/**/*",
    ],
  },
  config,
  eslint.configs.recommended,
  jsdoc.configs["flat/recommended"],
  tseslint.configs.stylisticTypeChecked,

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
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: {
            ArrowFunctionExpression: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
          },
          publicOnly: {
            esm: true,
            cjs: true,
          },
        },
      ],
    },

    languageOptions: {
      globals: {
        console: true,
        crypto: true,
        setTimeout: true,
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
