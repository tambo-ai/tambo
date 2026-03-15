import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90000,
  outputDir: "./test-results",
  use: {
    headless: true,
    channel: "chrome",
    screenshot: "on",
    launchOptions: {
      executablePath: "/usr/bin/google-chrome-stable",
      args: ["--no-sandbox", "--disable-gpu"],
    },
  },
});
