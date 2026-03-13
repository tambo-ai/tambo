import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90000,
  use: {
    headless: true,
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
