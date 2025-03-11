import nextJsConfig from "@tambo-ai/eslint-config/next-js";
import tseslint from "typescript-eslint";

export default tseslint.config(...nextJsConfig, {
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: [],
      },
    },
  },
});
