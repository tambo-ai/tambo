import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.svelte.ts"],
    environment: "jsdom",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**/*.ts", "src/lib/**/*.svelte.ts"],
      exclude: [
        "src/lib/**/*.test.ts",
        "src/lib/**/*.test.svelte.ts",
        "src/lib/index.ts",
        "node_modules/**",
      ],
      thresholds: {
        lines: 70,
        branches: 65,
        functions: 70,
        statements: 70,
      },
    },
    // Increase timeout for slow tests
    testTimeout: 10000,
    // Clear mocks between tests
    clearMocks: true,
    // Restore mocks after each test
    restoreMocks: true,
  },
});
