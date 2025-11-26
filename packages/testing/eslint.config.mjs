import config from "@tambo-ai/eslint-config/base";

const configFiles = [
  "eslint.config.mjs",
  "packages/testing/eslint.config.mjs",
  "lint-staged.config.mjs",
  "packages/testing/lint-staged.config.mjs",
];

export default [
  ...config,
  {
    files: configFiles,
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["jest.config.ts", ...configFiles],
        },
      },
    },
  },
];
