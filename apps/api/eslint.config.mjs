import config from "@tambo-ai/eslint-config/base";
import { defineConfig } from "eslint/config";

export default defineConfig(...config, {
  rules: {
    // Temporarily turning this off to reduce noise
    "@typescript-eslint/no-explicit-any": "off",
  },
});
