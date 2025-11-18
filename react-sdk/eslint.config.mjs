/** @type {import("@typescript-eslint/utils").TSESLint.FlatConfig.ConfigArray} */

import eslint from "@eslint/js";
import config from "@tambo-ai/eslint-config/base";
import jsdoc from "eslint-plugin-jsdoc";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
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
  eslintPluginReact.configs.flat?.recommended ?? {},
  eslintPluginReact.configs.flat?.["jsx-runtime"] ?? {},
  {
    settings: { react: { version: "detect" } },
    plugins: {
      // @ts-expect-error https://github.com/facebook/react/issues/28313#issuecomment-2580001921
      "react-hooks": eslintPluginReactHooks,
    },
    // @ts-expect-error https://github.com/facebook/react/issues/28313#issuecomment-2580001921
    rules: { ...eslintPluginReactHooks.configs.recommended.rules },
  },

  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // disable console.log but allow console.error and console.warn
      "no-console": ["error", { allow: ["error", "warn"] }],
      "no-unused-vars": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
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
