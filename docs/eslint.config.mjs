import config from "@tambo-ai/eslint-config/base";
import nextJsConfig from "@tambo-ai/eslint-config/next-js";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
  {
    ignores: [".next/**", ".source/**"],
    extends: [config, nextJsConfig],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,

        projectService: {
          allowDefaultProject: ["next-sitemap.config.js"],
        },
      },
    },
    rules: {
      "no-nested-ternary": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
    },
  },
  {
    files: ["next-sitemap.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-empty": "off",
    },
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["next-env.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
]);
