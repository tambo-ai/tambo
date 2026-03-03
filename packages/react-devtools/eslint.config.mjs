import reactInternal from "@tambo-ai/eslint-config/react-internal";
import { defineConfig } from "eslint/config";

export default defineConfig([
  ...reactInternal,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: {
          allowDefaultProject: ["*.mjs", "*.config.ts"],
        },
      },
    },
  },
]);
