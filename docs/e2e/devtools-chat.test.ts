import { test, expect } from "@playwright/test";

test("docs site loads with devtools button visible", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("http://localhost:8263/", { waitUntil: "load" });
  await page.waitForTimeout(5000);

  // Verify the devtools trigger button renders (green Tambo icon, bottom-right)
  const devtoolsButton = page.locator(
    'button[aria-label="Toggle Tambo DevTools"]',
  );
  await expect(devtoolsButton).toBeVisible({ timeout: 15000 });

  // Verify the chat collapsible trigger also renders
  const chatTrigger = page.locator(
    'button[aria-controls="message-thread-content"]',
  );
  await expect(chatTrigger).toBeVisible({ timeout: 5000 });

  // Verify the page content loaded
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 5000 });

  // Take screenshot showing docs page with devtools button visible
  await page.screenshot({
    path: "e2e/screenshots/docs-with-devtools.png",
    fullPage: false,
  });

  // Verify devtools has correct aria attributes
  const ariaExpanded = await devtoolsButton.getAttribute("aria-expanded");
  expect(ariaExpanded).toBe("false");
});
