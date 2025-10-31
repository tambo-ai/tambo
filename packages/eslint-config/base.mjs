import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import { globalIgnores } from "eslint/config";
import tokenUsageRule from "./rules/token-usage.js";
import tseslint from "typescript-eslint";

/**
 * A shared ESLint configuration for the repository.
 */
export default tseslint.config(
  js.configs.recommended,
  eslintConfigPrettier,
  tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      "@tambo": {
        rules: {
          "token-usage": tokenUsageRule,
        },
      },
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "@tambo/token-usage": "error",
    },
  },
  {
    ignores: ["dist/**"],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // We want to enforce that all async functions return a promise before the
      // function ends, this prevents errors from slipping through async
      // try/catch blocks
      "@typescript-eslint/return-await": ["error", "always"],
      "@typescript-eslint/promise-function-async": "error",
    },
  },
  {
    files: ["**/registry/**/*.tsx", "**/components/**/*.tsx"],
    rules: {
      "@tambo/token-usage": "error",
    },
  },
  globalIgnores(["examples/**"]),
);
