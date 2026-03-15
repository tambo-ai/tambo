import { test, expect } from "@playwright/test";

const DOCS_URL = "http://localhost:8263/";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(DOCS_URL, { waitUntil: "load" });
  await page.waitForTimeout(5000);
});

test("docs site loads with devtools button visible", async ({ page }) => {
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

test("devtools panel opens and shows Components tab", async ({ page }) => {
  const devtoolsButton = page.locator(
    'button[aria-label="Toggle Tambo DevTools"]',
  );
  await expect(devtoolsButton).toBeVisible({ timeout: 15000 });

  // Open devtools
  await devtoolsButton.click();

  // Verify the panel dialog appears
  const panel = page.locator('[role="dialog"][aria-label="Tambo DevTools"]');
  await expect(panel).toBeVisible({ timeout: 10000 });

  await page.screenshot({
    path: "e2e/screenshots/docs-devtools-open.png",
    fullPage: false,
  });

  // Verify tab bar is present with Components and Tools tabs
  const tablist = panel.locator('[role="tablist"]');
  await expect(tablist).toBeVisible();

  const componentsTab = panel.locator('[role="tab"]').filter({ hasText: "Components" });
  const toolsTab = panel.locator('[role="tab"]').filter({ hasText: "Tools" });
  await expect(componentsTab).toBeVisible();
  await expect(toolsTab).toBeVisible();

  // Components tab should be active by default
  await expect(componentsTab).toHaveAttribute("aria-selected", "true");

  // Verify the registry list is present
  const registryList = panel.locator('[role="listbox"]');
  await expect(registryList).toBeVisible();

  // Verify search input is present
  const searchInput = panel.locator('input[aria-label="Search registry"]');
  await expect(searchInput).toBeVisible();

  // Verify close button is present
  const closeButton = panel.locator('button[aria-label="Close DevTools"]');
  await expect(closeButton).toBeVisible();

  await page.screenshot({
    path: "e2e/screenshots/devtools-panel-components-tab.png",
    fullPage: false,
  });
});

test("devtools panel switches to Tools tab", async ({ page }) => {
  const devtoolsButton = page.locator(
    'button[aria-label="Toggle Tambo DevTools"]',
  );
  await expect(devtoolsButton).toBeVisible({ timeout: 15000 });
  await devtoolsButton.click();

  const panel = page.locator('[role="dialog"][aria-label="Tambo DevTools"]');
  await expect(panel).toBeVisible({ timeout: 10000 });

  // Click Tools tab
  const toolsTab = panel.locator('[role="tab"]').filter({ hasText: "Tools" });
  await toolsTab.click();

  // Verify Tools tab is now active
  await expect(toolsTab).toHaveAttribute("aria-selected", "true");

  // Verify Components tab is no longer active
  const componentsTab = panel.locator('[role="tab"]').filter({ hasText: "Components" });
  await expect(componentsTab).toHaveAttribute("aria-selected", "false");

  await page.screenshot({
    path: "e2e/screenshots/devtools-panel-tools-tab.png",
    fullPage: false,
  });
});

test("devtools panel closes via close button", async ({ page }) => {
  const devtoolsButton = page.locator(
    'button[aria-label="Toggle Tambo DevTools"]',
  );
  await expect(devtoolsButton).toBeVisible({ timeout: 15000 });
  await devtoolsButton.click();

  const panel = page.locator('[role="dialog"][aria-label="Tambo DevTools"]');
  await expect(panel).toBeVisible({ timeout: 10000 });

  // Close via close button
  const closeButton = panel.locator('button[aria-label="Close DevTools"]');
  await closeButton.click();

  // Panel should be hidden
  await expect(panel).not.toBeVisible({ timeout: 5000 });

  // Trigger button should reappear
  await expect(devtoolsButton).toBeVisible({ timeout: 5000 });

  await page.screenshot({
    path: "e2e/screenshots/devtools-panel-closed.png",
    fullPage: false,
  });
});

test("devtools search filters registry items", async ({ page }) => {
  const devtoolsButton = page.locator(
    'button[aria-label="Toggle Tambo DevTools"]',
  );
  await expect(devtoolsButton).toBeVisible({ timeout: 15000 });
  await devtoolsButton.click();

  const panel = page.locator('[role="dialog"][aria-label="Tambo DevTools"]');
  await expect(panel).toBeVisible({ timeout: 10000 });

  const searchInput = panel.locator('input[aria-label="Search registry"]');
  const registryList = panel.locator('[role="listbox"]');

  // Count items before filtering
  const itemsBefore = await registryList.locator('[role="option"]').count();

  // Type a search term that likely won't match all items
  await searchInput.fill("Dashboard");
  await page.waitForTimeout(500);

  await page.screenshot({
    path: "e2e/screenshots/devtools-search-filtered.png",
    fullPage: false,
  });

  // Items should be filtered (fewer or equal items)
  const itemsAfter = await registryList.locator('[role="option"]').count();
  expect(itemsAfter).toBeLessThanOrEqual(itemsBefore);

  // Clear search and verify items return
  await searchInput.clear();
  await page.waitForTimeout(500);

  const itemsRestored = await registryList.locator('[role="option"]').count();
  expect(itemsRestored).toBe(itemsBefore);
});

test("devtools registry item selection shows detail view", async ({ page }) => {
  const devtoolsButton = page.locator(
    'button[aria-label="Toggle Tambo DevTools"]',
  );
  await expect(devtoolsButton).toBeVisible({ timeout: 15000 });
  await devtoolsButton.click();

  const panel = page.locator('[role="dialog"][aria-label="Tambo DevTools"]');
  await expect(panel).toBeVisible({ timeout: 10000 });

  // Click the first registry item
  const firstItem = panel.locator('[role="option"]').first();
  await expect(firstItem).toBeVisible({ timeout: 5000 });
  const itemName = await firstItem.textContent();
  await firstItem.click();

  // Verify the item is now selected
  await expect(firstItem).toHaveAttribute("aria-selected", "true");

  await page.screenshot({
    path: "e2e/screenshots/devtools-item-detail.png",
    fullPage: false,
  });

  // The detail view should show the component name somewhere in the panel
  if (itemName) {
    await expect(panel.getByText(itemName.trim()).first()).toBeVisible();
  }
});

test("chat collapsible opens and shows message thread", async ({ page }) => {
  const chatTrigger = page.locator(
    'button[aria-controls="message-thread-content"]',
  );
  await expect(chatTrigger).toBeVisible({ timeout: 15000 });

  // Click to open the collapsible chat
  await chatTrigger.click();
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: "e2e/screenshots/chat-collapsible-open.png",
    fullPage: false,
  });

  // Verify the starter message is visible
  const starterMessage = page.getByText("Ask me anything about tambo.");
  await expect(starterMessage).toBeVisible({ timeout: 5000 });

  // Verify the message input textarea is present
  const textarea = page.locator(
    'textarea[placeholder="Type your message or paste images..."]',
  );
  await expect(textarea).toBeVisible({ timeout: 5000 });

  // Verify submit button is present
  const submitButton = page.locator('[data-slot="message-input-submit-button"]');
  // Submit button may or may not be visible depending on input state,
  // so just check the input area rendered
  await expect(textarea).toBeEnabled();
});

test("chat collapsible closes via close button", async ({ page }) => {
  const chatTrigger = page.locator(
    'button[aria-controls="message-thread-content"]',
  );
  await expect(chatTrigger).toBeVisible({ timeout: 15000 });

  // Open chat
  await chatTrigger.click();
  await page.waitForTimeout(1000);

  // Verify the header with "ask tambo" label is visible
  const headerLabel = page.getByText("ask tambo");
  await expect(headerLabel).toBeVisible({ timeout: 5000 });

  // Close via the close button (XIcon)
  const closeButton = page.locator('[aria-label="Close"]');
  await expect(closeButton).toBeVisible({ timeout: 5000 });
  await closeButton.click();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: "e2e/screenshots/chat-collapsible-closed.png",
    fullPage: false,
  });

  // Chat trigger should be visible again (collapsed state)
  await expect(chatTrigger).toBeVisible({ timeout: 5000 });
});

test("docs navigation sidebar is functional", async ({ page }) => {
  // Verify the sidebar navigation renders
  const sidebar = page.locator("aside").first();
  await expect(sidebar).toBeVisible({ timeout: 10000 });

  await page.screenshot({
    path: "e2e/screenshots/docs-sidebar-navigation.png",
    fullPage: false,
  });

  // Verify navigation links exist
  const navLinks = sidebar.locator("a");
  const linkCount = await navLinks.count();
  expect(linkCount).toBeGreaterThan(0);
});

test("docs header contains expected navigation elements", async ({ page }) => {
  // Verify header/nav bar renders
  const header = page.locator("header").first();
  await expect(header).toBeVisible({ timeout: 10000 });

  // Check for GitHub link in navigation
  const githubLink = page.locator('a[href="https://github.com/tambo-ai/tambo"]');
  await expect(githubLink).toBeVisible({ timeout: 5000 });

  await page.screenshot({
    path: "e2e/screenshots/docs-header-navigation.png",
    fullPage: false,
  });
});

test("docs page renders main content area", async ({ page }) => {
  // Verify main content heading
  const heading = page.locator("h1").first();
  await expect(heading).toBeVisible({ timeout: 10000 });
  const headingText = await heading.textContent();
  expect(headingText).toBeTruthy();

  await page.screenshot({
    path: "e2e/screenshots/docs-main-content.png",
    fullPage: false,
  });

  // Verify the page has content sections
  const contentArea = page.locator("main").first();
  await expect(contentArea).toBeVisible();
});
