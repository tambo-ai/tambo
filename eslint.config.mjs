import config from "@tambo-ai/eslint-config/base";

export default [
  ...config,
  {
    ignores: ["**/postcss.config.*", "**/tailwind.config.*"],
  },
];
