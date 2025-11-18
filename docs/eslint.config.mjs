import config from "@tambo-ai/eslint-config/base";
import nextJsConfig from "@tambo-ai/eslint-config/next-js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  config,
  ...nextJsConfig,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,

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
