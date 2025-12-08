import config from "@tambo-ai/eslint-config/base";

export default [
  ...config,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["jest.config.ts", "eslint.config.mjs"],
        },
      },
    },
  },
];
