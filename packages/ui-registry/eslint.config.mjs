import reactInternal from "@tambo-ai/eslint-config/react-internal";
import { defineConfig } from "eslint/config";

export default defineConfig([
  ...reactInternal,
  {
    rules: {
      // TODO: change to "error" after fixing all violations
      "react-hooks/rules-of-hooks": "warn",
    },
  },
]);
