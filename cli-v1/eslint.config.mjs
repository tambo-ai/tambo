import config from "@tambo-ai/eslint-config/base";

export default [
  ...config,
  {
    ignores: ["dist/**", "eslint.config.mjs", "skills/**"],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: ["./tsconfig.eslint.json"],
      },
    },
  },
];
