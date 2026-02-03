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
    // Allow config files to be linted without being in the main tsconfig
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.mjs"],
        },
      },
    },
  },
]);
