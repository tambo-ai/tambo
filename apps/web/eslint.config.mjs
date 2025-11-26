import nextJsConfig from "@tambo-ai/eslint-config/next-js";
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
    rules: {
      // We would like to turn on these rules, but there are too many small issues
      // in the apps/web project right now to do so.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      // Turning this off for a separate refactor later
      "no-nested-ternary": "off",
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [],
        },
      },
    },
  },
);
