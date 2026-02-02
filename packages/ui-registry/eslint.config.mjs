import reactInternal from "@tambo-ai/eslint-config/react-internal";
import { defineConfig } from "eslint/config";

export default defineConfig([
  ...reactInternal,
  {
    // Ignore test files and jest config - they use different tsconfig
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "__tests__/**/*",
      "jest.config.ts",
    ],
  },
  {
    // Allow scripts and config files to be linted without being in the main tsconfig
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.mjs", "scripts/*.ts"],
        },
      },
    },
  },
  {
    rules: {
      // TODO: change to "error" after fixing all violations
      "react-hooks/rules-of-hooks": "warn",
    },
  },
]);
