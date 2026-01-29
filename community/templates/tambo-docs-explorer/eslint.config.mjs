import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore copied reference template files:
    "src/components/tambo/dictation-button.tsx",
    "src/components/tambo/mcp-components.tsx",
    "src/components/tambo/message-input.tsx",
    "src/components/tambo/message.tsx",
    "src/components/tambo/scrollable-message-container.tsx",
    "src/components/tambo/text-editor.tsx",
    "src/components/tambo/elicitation-ui.tsx",
    "src/components/tambo/markdown-components.tsx",
    "src/components/tambo/mcp-config-modal.tsx",
    "src/components/tambo/message-generation-stage.tsx",
    "src/components/tambo/message-suggestions.tsx",
    "src/components/tambo/suggestions-tooltip.tsx",
    "src/components/tambo/thread-container.tsx",
    "src/components/tambo/thread-content.tsx",
    "src/components/tambo/thread-history.tsx",
  ]),
]);

export default eslintConfig;
