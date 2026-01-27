import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Ignores must be first - use patterns that match from project root
  {
    ignores: [
      // Convex generated files
      "convex/_generated/**",
      // Config files - match all variations
      "*.config.mjs",
      "**/*.config.mjs",
      "./*.config.mjs",
      "./**/*.config.mjs",
      "postcss.config.mjs",
      "eslint.config.mjs",
      "./postcss.config.mjs",
      "./eslint.config.mjs",
    ],
  },
  ...nextVitals,
  // TypeScript config - explicitly only process .ts and .tsx files
  ...nextTs.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"], // Explicitly exclude .mjs
  })),
]);

export default eslintConfig;
