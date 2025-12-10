import nextJsConfig from "@tambo-ai/eslint-config/next-js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...nextJsConfig,
  {
    ignores: [
      ".source/",
      "next-env.d.ts",
      ".next/**",
      "coverage/**",
      "__mocks__/fileMock.cjs",
    ],
  },
  {
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
  {
    rules: {
      "react/prop-types": "off",
    },
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/return-await": "off",
      "@typescript-eslint/promise-function-async": "off",
    },
  },
);
