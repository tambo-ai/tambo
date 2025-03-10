/** @type {import("@typescript-eslint/utils").TSESLint.FlatConfig.ConfigArray} */

import eslint from "@eslint/js";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**/*", "esm/**/*", "jest.config.ts", "eslint.config.mjs"] },
  eslint.configs.recommended,
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
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
);
