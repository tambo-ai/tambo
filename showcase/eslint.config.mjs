import nextJsConfig from "@tambo-ai/eslint-config/next-js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  ...nextJsConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["next-sitemap.config.js"],
        },
      },
    },
  },
  {
    files: ["next-sitemap.config.js"],
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
);
