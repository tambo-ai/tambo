import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Cold Next.js dev compilation can take 60s+ on first page load, so
  // allow enough headroom for the open-devtools click-retry loop (60s)
  // plus test assertions.
  timeout: 120000,
  retries: 1,
  outputDir: "./test-results",
  use: {
    headless: true,
    screenshot: "on",
    launchOptions: {
      // Override with PLAYWRIGHT_CHROMIUM_PATH for custom Chromium installations
      ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
        : {}),
      args: ["--no-sandbox", "--disable-gpu"],
    },
  },
  webServer: {
    command: "npm run dev",
    port: 8263,
    reuseExistingServer: true,
    timeout: 60000,
  },
});
