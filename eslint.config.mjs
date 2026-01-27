import config from "@tambo-ai/eslint-config/base";

export default [
  ...config,
  {
    // Ignore this template folder
    ignores: ["community/templates/tambo-nextjs-fullstack-starter/**"],
  },
];
