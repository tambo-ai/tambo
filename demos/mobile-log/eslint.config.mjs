import config from "@tambo-ai/eslint-config/base";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    extends: [config],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: {
          allowDefaultProject: ["*.mjs", "babel.config.js", "metro.config.js"],
        },
      },
    },
  },
  {
    files: ["babel.config.js", "metro.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
