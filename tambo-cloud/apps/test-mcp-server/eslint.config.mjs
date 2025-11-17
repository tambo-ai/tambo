import config from "@tambo-ai-cloud/eslint-config/base";
import tseslint from "typescript-eslint";

export default tseslint.config(...config, {
  languageOptions: {
    parserOptions: {
      project: "./tsconfig.json",
    },
  },
});
