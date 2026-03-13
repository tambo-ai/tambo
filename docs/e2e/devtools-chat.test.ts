import { test, expect, Page, Locator } from "@playwright/test";

const BASE_URL = "http://localhost:8263";

/**
 * Click a locator via DOM click() to work around Playwright's native click
 * not firing React synthetic events on portal-based devtools elements
 * in headless Chromium.
 */
async function jsClick(locator: Locator) {
  await locator.evaluate((el: HTMLElement) => el.click());
}

/**
 * Open devtools: wait for trigger, click it, wait for panel.
 * @returns Locator for the devtools panel dialog.
 */
async function openDevtools(page: Page) {
  const devtoolsButton = page.locator(
    'button[aria-label="Toggle Tambo DevTools"]',
  );
  await expect(devtoolsButton).toBeVisible({ timeout: 30000 });
  await jsClick(devtoolsButton);

  const panel = page.locator('[role="dialog"][aria-label="Tambo DevTools"]');
  await expect(panel).toBeVisible({ timeout: 10000 });
  return panel;
}

test.describe("Devtools visibility and interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    // Clear devtools localStorage state so each test starts fresh
    await page.addInitScript(() => {
      localStorage.removeItem("tambo-devtools-state");
    });
  });

  test("docs site loads with devtools trigger button visible", async ({
    page,
  }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const devtoolsButton = page.locator(
      'button[aria-label="Toggle Tambo DevTools"]',
    );
    await expect(devtoolsButton).toBeVisible({ timeout: 30000 });

    // Button should indicate panel is closed
    await expect(devtoolsButton).toHaveAttribute("aria-expanded", "false");

    // Page content should have loaded
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });

  test("clicking trigger opens devtools panel", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    // Trigger button should hide when panel is open
    const devtoolsButton = page.locator(
      'button[aria-label="Toggle Tambo DevTools"]',
    );
    await expect(devtoolsButton).not.toBeVisible();

    // Panel should have correct role and label
    await expect(panel).toHaveAttribute("role", "dialog");
    await expect(panel).toHaveAttribute("aria-label", "Tambo DevTools");
  });

  test("devtools panel shows Components tab with registered components", async ({
    page,
  }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    // Components tab should be active by default
    const componentsTab = panel.locator('[role="tab"]', {
      hasText: "Components",
    });
    await expect(componentsTab).toHaveAttribute("aria-selected", "true");

    // Should show the registered components from docs/src/lib/tambo.ts
    await expect(panel.getByText("DashboardCard")).toBeVisible({
      timeout: 5000,
    });
    await expect(panel.getByText("GitHubIssueCreator")).toBeVisible();
    await expect(panel.getByText("DiscordInvite")).toBeVisible();
  });

  test("switching to Tools tab works", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    // Click Tools tab via JS
    const toolsTab = panel.locator('[role="tab"]', { hasText: "Tools" });
    await jsClick(toolsTab);
    await expect(toolsTab).toHaveAttribute("aria-selected", "true");

    // The tools tabpanel should be visible
    const toolsPanel = panel.locator("#tambo-devtools-tabpanel-tools");
    await expect(toolsPanel).toBeVisible();
  });

  test("switching to Timeline tab works", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    // Click Timeline tab via JS
    const timelineTab = panel.locator('[role="tab"]', {
      hasText: "Timeline",
    });
    await jsClick(timelineTab);
    await expect(timelineTab).toHaveAttribute("aria-selected", "true");

    // Timeline tabpanel should be visible
    const timelinePanel = panel.locator("#tambo-devtools-tabpanel-timeline");
    await expect(timelinePanel).toBeVisible();
  });

  test("selecting a component shows detail view", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    // Click on DashboardCard in the list via JS
    const dashboardItem = panel.getByText("DashboardCard").first();
    await expect(dashboardItem).toBeVisible({ timeout: 5000 });
    await jsClick(dashboardItem);

    // Wait for detail view to appear and check for description
    await page.waitForTimeout(500);
    const panelText = await panel.textContent();
    expect(panelText).toContain("directs users to the tambo dashboard");
  });

  test("closing devtools panel with close button", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    // Click close button via JS
    const closeButton = panel.locator('button[aria-label="Close DevTools"]');
    await jsClick(closeButton);

    // Panel should disappear
    await expect(panel).not.toBeVisible({ timeout: 5000 });

    // Trigger button should reappear
    const devtoolsButton = page.locator(
      'button[aria-label="Toggle Tambo DevTools"]',
    );
    await expect(devtoolsButton).toBeVisible({ timeout: 5000 });
  });

  test("closing devtools panel with Escape key dispatches keydown", async ({
    page,
  }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    // Dispatch a keyboard Escape event via JS to match the document-level listener
    await page.evaluate(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    // Panel should disappear
    await expect(panel).not.toBeVisible({ timeout: 5000 });

    const devtoolsButton = page.locator(
      'button[aria-label="Toggle Tambo DevTools"]',
    );
    await expect(devtoolsButton).toBeVisible({ timeout: 5000 });
  });

  test("search filter narrows component list", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    // All three components should be visible
    await expect(panel.getByText("DashboardCard")).toBeVisible({
      timeout: 5000,
    });
    await expect(panel.getByText("GitHubIssueCreator")).toBeVisible();
    await expect(panel.getByText("DiscordInvite")).toBeVisible();

    // Type in search box to filter
    const searchInput = panel.locator('input[type="text"]');
    await searchInput.fill("Dashboard");

    // Only DashboardCard should remain visible
    await expect(panel.getByText("DashboardCard")).toBeVisible();
    await expect(panel.getByText("GitHubIssueCreator")).not.toBeVisible();
    await expect(panel.getByText("DiscordInvite")).not.toBeVisible();
  });

  test("devtools panel state persists in localStorage", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    // Switch to Tools tab via JS
    const toolsTab = panel.locator('[role="tab"]', { hasText: "Tools" });
    await jsClick(toolsTab);
    await expect(toolsTab).toHaveAttribute("aria-selected", "true");

    // Verify state was persisted to localStorage
    const stored = await page.evaluate(() =>
      localStorage.getItem("tambo-devtools-state"),
    );
    const parsed = JSON.parse(stored!);
    expect(parsed.isOpen).toBe(true);
    expect(parsed.activeTab).toBe("tools");

    // Use client-side navigation (click a link) to verify state survives
    // within a Next.js SPA navigation
    const quickstartLink = page.locator('a[href*="quickstart"]').first();
    if (await quickstartLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await quickstartLink.click();
      await page.waitForTimeout(2000);

      const panelAfterNav = page.locator(
        '[role="dialog"][aria-label="Tambo DevTools"]',
      );
      await expect(panelAfterNav).toBeVisible({ timeout: 15000 });
    }
  });

  test("components tab shows correct count in tab label", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    // Components tab should show count of 3 (DashboardCard, GitHubIssueCreator, DiscordInvite)
    const componentsTab = panel.locator('[role="tab"]', {
      hasText: "Components",
    });
    await expect(componentsTab).toContainText("(3)");
  });
});
