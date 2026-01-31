import eslint from "@eslint/js";
import eslintAstroPlugin from "eslint-plugin-astro";

export default [
  // Global ignores
  {
    ignores: ["dist/", ".astro/", "node_modules/", "package-lock.json"],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // Astro files
  ...eslintAstroPlugin.configs.recommended,
];
