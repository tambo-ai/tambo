/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "@next/next/no-img-element": "off",
  },
  ignorePatterns: ["next-env.d.ts"],
  overrides: [
    {
      files: ["src/components/tambo/**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
  ],
};