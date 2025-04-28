import nextJsConfig from "@tambo-ai-cloud/eslint-config/next-js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...nextJsConfig,
  { ignores: [".source/"] },
  {
    rules: {
      // We would like to turn on these rules, but there are too many small issues
      // in the apps/web project right now to do so.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
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
