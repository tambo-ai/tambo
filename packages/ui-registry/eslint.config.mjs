import reactInternal from "@tambo-ai/eslint-config/react-internal";
import { defineConfig } from "eslint/config";

export default defineConfig([
  ...reactInternal,
  {
    // Ignore test files and jest config - they use @jest/globals types not in the main tsconfig
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "__tests__/**/*",
      "jest.config.ts",
    ],
  },
  {
    rules: {
      // TODO: change to "error" after fixing all violations
      "react-hooks/rules-of-hooks": "warn",
    },
  },
]);
