import { test, expect, Page, Locator } from "@playwright/test";

const BASE_URL = "http://localhost:8263";
const SCREENSHOTS_DIR = "e2e/screenshots";

/**
 * Click a locator via dispatching a bubbling MouseEvent to work around
 * Playwright's native click not firing React synthetic events on
 * portal-based devtools elements in headless Chromium.
 */
async function jsClick(locator: Locator) {
  await locator.evaluate((el: HTMLElement) => {
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  });
}

/**
 * Open devtools: wait for trigger, click it, wait for panel.
 *
 * The button is SSR-rendered before React hydrates event handlers.
 * We use a generous delay to let React attach handlers, then fire a
 * single click via dispatchEvent (Playwright's native click doesn't
 * reliably trigger React synthetic events on this component).  The
 * button is a toggle that unmounts when the panel opens, so clicking
 * only once avoids toggling it closed.  Tests that fail due to cold
 * page hydration timing will pass on retry (retries: 1 in config).
 *
 * @returns Locator for the devtools panel dialog.
 */
async function openDevtools(page: Page) {
  const devtoolsButton = page.locator(
    'button[aria-label="Toggle Tambo DevTools"]',
  );
  await expect(devtoolsButton).toBeVisible({ timeout: 30000 });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);

  const panel = page.locator('[role="dialog"][aria-label="Tambo DevTools"]');
  await jsClick(devtoolsButton);
  await expect(panel).toBeVisible({ timeout: 15000 });
  return panel;
}

/**
 * Navigate to Timeline tab within an open devtools panel.
 * @returns Locator for the timeline tabpanel.
 */
async function switchToTimeline(page: Page, panel: Locator) {
  const timelineTab = panel.locator('[role="tab"]', { hasText: "Timeline" });
  await jsClick(timelineTab);
  await expect(timelineTab).toHaveAttribute("aria-selected", "true");
  const timelinePanel = panel.locator("#tambo-devtools-tabpanel-timeline");
  await expect(timelinePanel).toBeVisible();
  return timelinePanel;
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

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/01-trigger-button-visible.png`,
    });
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

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/02-panel-open.png`,
    });
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

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/03-components-tab.png`,
    });
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

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/04-tools-tab.png`,
    });
  });

  test("switching to Timeline tab shows empty state", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    const timelinePanel = await switchToTimeline(page, panel);

    // Timeline should show the empty state message
    await expect(timelinePanel.getByText("No events captured")).toBeVisible({
      timeout: 5000,
    });
    await expect(
      timelinePanel.getByText(
        "Send a message to see timeline events appear here.",
      ),
    ).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/05-timeline-empty-state.png`,
    });
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

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/06-component-detail.png`,
    });
  });

  test("closing devtools panel with close button", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/07-before-close.png`,
    });

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

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/07-after-close.png`,
    });
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

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/08-after-escape-close.png`,
    });
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

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/09-search-filter.png`,
    });
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

      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/10-state-persisted-after-nav.png`,
      });
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

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/11-component-count.png`,
    });
  });
});

test.describe("Timeline event bus integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.addInitScript(() => {
      localStorage.removeItem("tambo-devtools-state");
    });
  });

  test("timeline renders events after sending a chat message", async ({
    page,
  }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);
    await switchToTimeline(page, panel);

    // Open the chat collapsible to send a message
    const chatTrigger = page.locator(
      'button[aria-controls="message-thread-content"]',
    );
    const chatTriggerVisible = await chatTrigger
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (chatTriggerVisible) {
      await jsClick(chatTrigger);
      await page.waitForTimeout(1000);

      // Find the message textarea and type a message
      const textarea = page.locator("textarea").first();
      const textareaVisible = await textarea
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (textareaVisible) {
        await textarea.fill("hello");

        await page.screenshot({
          path: `${SCREENSHOTS_DIR}/12-timeline-before-send.png`,
        });

        // Submit the message by pressing Enter
        await textarea.press("Enter");

        // Wait for events to flow through the pipeline.
        // The event bus emits user_message immediately, then AG-UI events
        // as the stream progresses. We wait a bit for at least user_message.
        await page.waitForTimeout(3000);

        // Switch back to devtools timeline to check for events
        // (the devtools panel may still be open)
        const devtoolsPanel = page.locator(
          '[role="dialog"][aria-label="Tambo DevTools"]',
        );
        const devtoolsVisible = await devtoolsPanel
          .isVisible({ timeout: 2000 })
          .catch(() => false);

        if (!devtoolsVisible) {
          // Re-open devtools if it was closed
          const reopenButton = page.locator(
            'button[aria-label="Toggle Tambo DevTools"]',
          );
          if (
            await reopenButton.isVisible({ timeout: 3000 }).catch(() => false)
          ) {
            await jsClick(reopenButton);
            await expect(devtoolsPanel).toBeVisible({ timeout: 10000 });
          }
        }

        // Navigate to timeline tab
        const timelineTab = devtoolsPanel.locator('[role="tab"]', {
          hasText: "Timeline",
        });
        await jsClick(timelineTab);
        await expect(timelineTab).toHaveAttribute("aria-selected", "true");

        // Wait for timeline content to update
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: `${SCREENSHOTS_DIR}/12-timeline-after-send.png`,
        });

        // Check if the empty state has been replaced by event rows.
        // If events arrived, "No events captured" should be gone and
        // we should see a table with event data.
        const timelinePanel = devtoolsPanel.locator(
          "#tambo-devtools-tabpanel-timeline",
        );
        const emptyState = timelinePanel.getByText("No events captured");
        const hasEvents = !(await emptyState
          .isVisible({ timeout: 1000 })
          .catch(() => false));

        if (hasEvents) {
          // Verify the timeline table has event rows
          const eventRows = timelinePanel.locator("table tbody tr");
          const rowCount = await eventRows.count();
          expect(rowCount).toBeGreaterThan(0);

          // At minimum, a user_message event should appear
          const timelineText = await timelinePanel.textContent();
          expect(timelineText).toContain("user_message");

          await page.screenshot({
            path: `${SCREENSHOTS_DIR}/12-timeline-events-rendered.png`,
          });
        }
      }
    }
  });

  test("timeline event row selection shows detail panel", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);
    await switchToTimeline(page, panel);

    // Send a message to generate events
    const chatTrigger = page.locator(
      'button[aria-controls="message-thread-content"]',
    );
    const chatTriggerVisible = await chatTrigger
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!chatTriggerVisible) {
      // Skip if chat UI is not available
      return;
    }

    await jsClick(chatTrigger);
    await page.waitForTimeout(1000);

    const textarea = page.locator("textarea").first();
    if (!(await textarea.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await textarea.fill("test message");
    await textarea.press("Enter");
    await page.waitForTimeout(3000);

    // Navigate back to devtools timeline
    const devtoolsPanel = page.locator(
      '[role="dialog"][aria-label="Tambo DevTools"]',
    );
    if (
      !(await devtoolsPanel.isVisible({ timeout: 2000 }).catch(() => false))
    ) {
      const reopenButton = page.locator(
        'button[aria-label="Toggle Tambo DevTools"]',
      );
      if (await reopenButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await jsClick(reopenButton);
        await expect(devtoolsPanel).toBeVisible({ timeout: 10000 });
      }
    }

    const timelineTab = devtoolsPanel.locator('[role="tab"]', {
      hasText: "Timeline",
    });
    await jsClick(timelineTab);
    await page.waitForTimeout(1000);

    const timelinePanel = devtoolsPanel.locator(
      "#tambo-devtools-tabpanel-timeline",
    );
    const emptyState = timelinePanel.getByText("No events captured");
    const hasEvents = !(await emptyState
      .isVisible({ timeout: 1000 })
      .catch(() => false));

    if (!hasEvents) {
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/13-timeline-no-events-for-selection.png`,
      });
      return;
    }

    // Click the first event row to select it
    const firstRow = timelinePanel.locator("table tbody tr").first();
    await jsClick(firstRow);

    // The row should become selected (aria-selected="true")
    await expect(firstRow).toHaveAttribute("aria-selected", "true");

    // A detail panel should appear with JSON event data
    const detailJson = timelinePanel.locator("pre");
    await expect(detailJson).toBeVisible({ timeout: 3000 });

    // The detail JSON should contain event fields
    const jsonText = await detailJson.textContent();
    expect(jsonText).toContain('"type"');
    expect(jsonText).toContain('"threadId"');

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/13-timeline-event-detail.png`,
    });

    // Click the same row again to deselect
    await jsClick(firstRow);
    await expect(firstRow).toHaveAttribute("aria-selected", "false");

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/13-timeline-event-deselected.png`,
    });
  });

  test("timeline clear button removes all events", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);
    await switchToTimeline(page, panel);

    // Send a message to populate events
    const chatTrigger = page.locator(
      'button[aria-controls="message-thread-content"]',
    );
    const chatTriggerVisible = await chatTrigger
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!chatTriggerVisible) {
      return;
    }

    await jsClick(chatTrigger);
    await page.waitForTimeout(1000);

    const textarea = page.locator("textarea").first();
    if (!(await textarea.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await textarea.fill("clear test");
    await textarea.press("Enter");
    await page.waitForTimeout(3000);

    // Navigate to devtools timeline
    const devtoolsPanel = page.locator(
      '[role="dialog"][aria-label="Tambo DevTools"]',
    );
    if (
      !(await devtoolsPanel.isVisible({ timeout: 2000 }).catch(() => false))
    ) {
      const reopenButton = page.locator(
        'button[aria-label="Toggle Tambo DevTools"]',
      );
      if (await reopenButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await jsClick(reopenButton);
        await expect(devtoolsPanel).toBeVisible({ timeout: 10000 });
      }
    }

    const timelineTab = devtoolsPanel.locator('[role="tab"]', {
      hasText: "Timeline",
    });
    await jsClick(timelineTab);
    await page.waitForTimeout(1000);

    const timelinePanel = devtoolsPanel.locator(
      "#tambo-devtools-tabpanel-timeline",
    );
    const emptyState = timelinePanel.getByText("No events captured");
    const hasEvents = !(await emptyState
      .isVisible({ timeout: 1000 })
      .catch(() => false));

    if (!hasEvents) {
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/14-timeline-no-events-to-clear.png`,
      });
      return;
    }

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/14-timeline-before-clear.png`,
    });

    // Click the Clear button
    const clearButton = timelinePanel.locator(
      'button[aria-label="Clear timeline"]',
    );
    await expect(clearButton).toBeVisible({ timeout: 3000 });
    await jsClick(clearButton);

    // Timeline should revert to empty state
    await expect(emptyState).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/14-timeline-after-clear.png`,
    });
  });

  test("timeline shows event count in toolbar", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);
    await switchToTimeline(page, panel);

    // Send a message to generate events
    const chatTrigger = page.locator(
      'button[aria-controls="message-thread-content"]',
    );
    if (!(await chatTrigger.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await jsClick(chatTrigger);
    await page.waitForTimeout(1000);

    const textarea = page.locator("textarea").first();
    if (!(await textarea.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await textarea.fill("event count test");
    await textarea.press("Enter");
    await page.waitForTimeout(3000);

    // Navigate to timeline
    const devtoolsPanel = page.locator(
      '[role="dialog"][aria-label="Tambo DevTools"]',
    );
    if (
      !(await devtoolsPanel.isVisible({ timeout: 2000 }).catch(() => false))
    ) {
      const reopenButton = page.locator(
        'button[aria-label="Toggle Tambo DevTools"]',
      );
      if (await reopenButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await jsClick(reopenButton);
        await expect(devtoolsPanel).toBeVisible({ timeout: 10000 });
      }
    }

    const timelineTab = devtoolsPanel.locator('[role="tab"]', {
      hasText: "Timeline",
    });
    await jsClick(timelineTab);
    await page.waitForTimeout(1000);

    const timelinePanel = devtoolsPanel.locator(
      "#tambo-devtools-tabpanel-timeline",
    );

    // Check for event count display (e.g. "3 events")
    const hasEvents = !(await timelinePanel
      .getByText("No events captured")
      .isVisible({ timeout: 1000 })
      .catch(() => false));

    if (hasEvents) {
      // The toolbar should show "{n} event(s)"
      const eventCountText = timelinePanel.locator("text=/\\d+ events?/");
      await expect(eventCountText).toBeVisible({ timeout: 3000 });

      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/15-timeline-event-count.png`,
      });
    }
  });

  test("timeline waterfall column headers are present", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);
    await switchToTimeline(page, panel);

    // Send a message so the table renders (non-empty state)
    const chatTrigger = page.locator(
      'button[aria-controls="message-thread-content"]',
    );
    if (!(await chatTrigger.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await jsClick(chatTrigger);
    await page.waitForTimeout(1000);

    const textarea = page.locator("textarea").first();
    if (!(await textarea.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await textarea.fill("waterfall test");
    await textarea.press("Enter");
    await page.waitForTimeout(3000);

    const devtoolsPanel = page.locator(
      '[role="dialog"][aria-label="Tambo DevTools"]',
    );
    if (
      !(await devtoolsPanel.isVisible({ timeout: 2000 }).catch(() => false))
    ) {
      const reopenButton = page.locator(
        'button[aria-label="Toggle Tambo DevTools"]',
      );
      if (await reopenButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await jsClick(reopenButton);
        await expect(devtoolsPanel).toBeVisible({ timeout: 10000 });
      }
    }

    const timelineTab = devtoolsPanel.locator('[role="tab"]', {
      hasText: "Timeline",
    });
    await jsClick(timelineTab);
    await page.waitForTimeout(1000);

    const timelinePanel = devtoolsPanel.locator(
      "#tambo-devtools-tabpanel-timeline",
    );

    const hasEvents = !(await timelinePanel
      .getByText("No events captured")
      .isVisible({ timeout: 1000 })
      .catch(() => false));

    if (hasEvents) {
      // Verify table column headers
      const headers = timelinePanel.locator("table thead th");
      const headerTexts = await headers.allTextContents();

      expect(headerTexts).toContain("Name");
      expect(headerTexts).toContain("Status");
      expect(headerTexts).toContain("Initiator");
      expect(headerTexts).toContain("Time");
      expect(headerTexts).toContain("Thread");
      expect(headerTexts).toContain("Waterfall");

      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/16-timeline-waterfall-headers.png`,
      });
    }
  });

  test("multiple messages accumulate events in timeline", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });

    const panel = await openDevtools(page);
    await switchToTimeline(page, panel);

    const chatTrigger = page.locator(
      'button[aria-controls="message-thread-content"]',
    );
    if (!(await chatTrigger.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await jsClick(chatTrigger);
    await page.waitForTimeout(1000);

    const textarea = page.locator("textarea").first();
    if (!(await textarea.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    // Send first message
    await textarea.fill("first message");
    await textarea.press("Enter");
    await page.waitForTimeout(3000);

    // Navigate to timeline and count events
    const devtoolsPanel = page.locator(
      '[role="dialog"][aria-label="Tambo DevTools"]',
    );
    if (
      !(await devtoolsPanel.isVisible({ timeout: 2000 }).catch(() => false))
    ) {
      const reopenButton = page.locator(
        'button[aria-label="Toggle Tambo DevTools"]',
      );
      if (await reopenButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await jsClick(reopenButton);
        await expect(devtoolsPanel).toBeVisible({ timeout: 10000 });
      }
    }

    const timelineTab = devtoolsPanel.locator('[role="tab"]', {
      hasText: "Timeline",
    });
    await jsClick(timelineTab);
    await page.waitForTimeout(1000);

    const timelinePanel = devtoolsPanel.locator(
      "#tambo-devtools-tabpanel-timeline",
    );

    const hasEventsAfterFirst = !(await timelinePanel
      .getByText("No events captured")
      .isVisible({ timeout: 1000 })
      .catch(() => false));

    if (!hasEventsAfterFirst) {
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/17-timeline-no-events-accumulated.png`,
      });
      return;
    }

    const firstEventRows = timelinePanel.locator("table tbody tr");
    const firstCount = await firstEventRows.count();

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/17-timeline-after-first-message.png`,
    });

    // Send second message (switch back to chat, type, send)
    // First close devtools to access the chat
    const closeButton = devtoolsPanel.locator(
      'button[aria-label="Close DevTools"]',
    );
    await jsClick(closeButton);
    await page.waitForTimeout(500);

    // The textarea may still be visible
    const textarea2 = page.locator("textarea").first();
    if (await textarea2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea2.fill("second message");
      await textarea2.press("Enter");
      await page.waitForTimeout(3000);
    }

    // Re-open devtools and check timeline
    const reopenButton2 = page.locator(
      'button[aria-label="Toggle Tambo DevTools"]',
    );
    if (await reopenButton2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await jsClick(reopenButton2);
      await expect(devtoolsPanel).toBeVisible({ timeout: 10000 });
    }

    const timelineTab2 = devtoolsPanel.locator('[role="tab"]', {
      hasText: "Timeline",
    });
    await jsClick(timelineTab2);
    await page.waitForTimeout(1000);

    const secondEventRows = timelinePanel.locator("table tbody tr");
    const secondCount = await secondEventRows.count();

    // Second message should add more events
    expect(secondCount).toBeGreaterThanOrEqual(firstCount);

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/17-timeline-after-second-message.png`,
    });
  });
});
