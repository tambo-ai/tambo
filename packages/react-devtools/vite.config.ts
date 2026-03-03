import { tamboViteConfig } from "@tambo-ai/vite-config";
import react from "@vitejs/plugin-react";
import { mergeConfig } from "vite";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";

export default mergeConfig(
  defineConfig({
    plugins: [react(), svgr({ include: "**/*.svg" })],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      coverage: {
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/**/*.test.{ts,tsx}",
          "src/**/*.mock.{ts,tsx}",
          "src/**/__tests__/**",
          "src/**/__mocks__/**",
        ],
        provider: "v8",
        reporter: ["text", "lcov"],
      },
    },
    resolve: {
      dedupe: ["react", "react-dom"],
    },
  }),
  tamboViteConfig({
    entry: ["./src/index.ts", "./src/production.ts"],
    tsconfigPath: "./tsconfig.json",
    exclude: ["./vitest.setup.ts", "src/**/*.test.ts", "src/**/*.test.tsx"],
  }),
);
