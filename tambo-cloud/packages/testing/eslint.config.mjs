import config from "@tambo-ai-cloud/eslint-config/base";

export default [
  ...config,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["jest.config.ts", "*.mjs"],
        },
      },
    },
  },
];
