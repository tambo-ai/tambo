import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import globals from "globals";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs["flat/recommended"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    rules: {
      // Allow underscore-prefixed unused vars (common pattern for intentionally unused params)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Disallow console.log but allow console.error and console.warn
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Enforce consistent return types
      "@typescript-eslint/explicit-function-return-type": "off",
      // Prefer const over let when variable is not reassigned
      "prefer-const": "error",
      // Disallow var
      "no-var": "error",
      // Enforce === and !== over == and !=
      eqeqeq: ["error", "always", { null: "ignore" }],
      // Disallow duplicate imports
      "no-duplicate-imports": "error",
      // Require curly braces for all control statements
      curly: ["error", "all"],
      // No debugger statements
      "no-debugger": "error",
      // No alert/confirm/prompt
      "no-alert": "error",
      // Disallow eval
      "no-eval": "error",
      // Disallow implied eval
      "no-implied-eval": "error",
      // Disallow new Function()
      "no-new-func": "error",
      // Require strict equality for typeof
      "valid-typeof": "error",
      // Disallow async functions without await
      "require-await": "off",
      "@typescript-eslint/require-await": "off",
      // Allow explicit any only when necessary (should use eslint-disable comment)
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      // Svelte 5 allows duplicate imports between module and instance scripts
      "no-duplicate-imports": "off",
      // Svelte 5 $props() destructuring uses let, not const
      "prefer-const": "off",
    },
  },
  {
    // Test files can use console.log and have relaxed rules
    files: ["**/*.test.ts", "**/*.test.svelte.ts"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: [
      "dist/**",
      ".svelte-kit/**",
      "node_modules/**",
      "build/**",
      "coverage/**",
      // .svelte.ts files should be handled by svelte-check, not eslint
      "**/*.svelte.ts",
    ],
  },
);
