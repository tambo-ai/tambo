import nextJsConfig from "@tambo-ai-cloud/eslint-config/next-js";
import tseslint from "typescript-eslint";

export default tseslint.config(...nextJsConfig, { ignores: [".source/"] });
