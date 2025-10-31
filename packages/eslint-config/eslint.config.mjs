import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

/**
 * ESLint config for the eslint-config package itself.
 * Uses simpler JS-only rules without TypeScript parsing.
 */
export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
