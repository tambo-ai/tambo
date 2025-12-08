import config from "@tambo-ai/eslint-config/base";

export default [
  ...config,
  {
    rules: {
      // TODO: remove this once this package has been updated
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
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
