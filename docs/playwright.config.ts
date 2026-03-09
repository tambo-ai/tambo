import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90000,
  use: {
    headless: true,
    channel: "chrome",
    launchOptions: {
      executablePath: "/usr/bin/google-chrome-stable",
      args: ["--no-sandbox", "--disable-gpu"],
    },
  },
});
