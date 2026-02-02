/**
 * Tests for the stream-status store.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { tick } from "svelte";
import { createStreamStatusStore } from "./stream-status.svelte.js";

describe("createStreamStatusStore", () => {
  let store: ReturnType<typeof createStreamStatusStore>;

  beforeEach(() => {
    store = createStreamStatusStore();
  });

  describe("initial state", () => {
    it("should have isStreaming as false", () => {
      expect(store.isStreaming).toBe(false);
    });

    it("should have isComplete as true", () => {
      expect(store.isComplete).toBe(true);
    });

    it("should have empty propStatuses", () => {
      expect(store.propStatuses).toEqual([]);
    });

    it("should have correct initial status object", () => {
      expect(store.status).toEqual({
        isStreaming: false,
        isComplete: true,
        propStatuses: [],
      });
    });
  });

  describe("setStreaming", () => {
    it("should set isStreaming to true", async () => {
      store.setStreaming(true);
      await tick();
      expect(store.isStreaming).toBe(true);
    });

    it("should set isComplete to false when streaming starts", async () => {
      store.setStreaming(true);
      await tick();
      expect(store.isComplete).toBe(false);
    });

    it("should set isStreaming to false", async () => {
      store.setStreaming(true);
      await tick();
      store.setStreaming(false);
      await tick();
      expect(store.isStreaming).toBe(false);
    });

    it("should not change isComplete when setting streaming to false", async () => {
      store.setStreaming(true);
      await tick();
      // isComplete is now false
      expect(store.isComplete).toBe(false);
      store.setStreaming(false);
      await tick();
      // isComplete should still be false (not automatically set to true)
      expect(store.isComplete).toBe(false);
    });
  });

  describe("setComplete", () => {
    it("should set isComplete to true", async () => {
      store.setStreaming(true);
      await tick();
      expect(store.isComplete).toBe(false);
      store.setComplete(true);
      await tick();
      expect(store.isComplete).toBe(true);
    });

    it("should set isStreaming to false when complete is true", async () => {
      store.setStreaming(true);
      await tick();
      expect(store.isStreaming).toBe(true);
      store.setComplete(true);
      await tick();
      expect(store.isStreaming).toBe(false);
    });

    it("should set isComplete to false", async () => {
      store.setComplete(false);
      await tick();
      expect(store.isComplete).toBe(false);
    });

    it("should not change isStreaming when setting complete to false", async () => {
      // Start streaming
      store.setStreaming(true);
      await tick();
      expect(store.isStreaming).toBe(true);
      // Setting complete to false should not affect isStreaming
      store.setComplete(false);
      await tick();
      expect(store.isStreaming).toBe(true);
    });
  });

  describe("updatePropStatus", () => {
    it("should add a new prop status", async () => {
      store.updatePropStatus("title", true, false);
      await tick();

      expect(store.propStatuses).toHaveLength(1);
      expect(store.propStatuses[0]).toEqual({
        key: "title",
        isStreaming: true,
        isComplete: false,
      });
    });

    it("should add multiple prop statuses", async () => {
      store.updatePropStatus("title", true, false);
      store.updatePropStatus("content", true, false);
      await tick();

      expect(store.propStatuses).toHaveLength(2);
      expect(store.propStatuses[0].key).toBe("title");
      expect(store.propStatuses[1].key).toBe("content");
    });

    it("should update existing prop status", async () => {
      store.updatePropStatus("title", true, false);
      await tick();
      expect(store.propStatuses[0]).toEqual({
        key: "title",
        isStreaming: true,
        isComplete: false,
      });

      store.updatePropStatus("title", false, true);
      await tick();

      expect(store.propStatuses).toHaveLength(1);
      expect(store.propStatuses[0]).toEqual({
        key: "title",
        isStreaming: false,
        isComplete: true,
      });
    });

    it("should preserve order when updating existing prop", async () => {
      store.updatePropStatus("a", true, false);
      store.updatePropStatus("b", true, false);
      store.updatePropStatus("c", true, false);
      await tick();

      store.updatePropStatus("b", false, true);
      await tick();

      expect(store.propStatuses[0].key).toBe("a");
      expect(store.propStatuses[1].key).toBe("b");
      expect(store.propStatuses[2].key).toBe("c");
      expect(store.propStatuses[1].isComplete).toBe(true);
    });
  });

  describe("reset", () => {
    it("should reset isStreaming to false", async () => {
      store.setStreaming(true);
      await tick();
      store.reset();
      await tick();
      expect(store.isStreaming).toBe(false);
    });

    it("should reset isComplete to true", async () => {
      store.setStreaming(true);
      await tick();
      expect(store.isComplete).toBe(false);
      store.reset();
      await tick();
      expect(store.isComplete).toBe(true);
    });

    it("should clear propStatuses", async () => {
      store.updatePropStatus("title", true, false);
      store.updatePropStatus("content", true, false);
      await tick();
      expect(store.propStatuses).toHaveLength(2);

      store.reset();
      await tick();
      expect(store.propStatuses).toEqual([]);
    });
  });

  describe("status (derived)", () => {
    it("should reflect streaming state", async () => {
      store.setStreaming(true);
      await tick();

      expect(store.status.isStreaming).toBe(true);
      expect(store.status.isComplete).toBe(false);
    });

    it("should reflect complete state", async () => {
      store.setStreaming(true);
      await tick();
      store.setComplete(true);
      await tick();

      expect(store.status.isStreaming).toBe(false);
      expect(store.status.isComplete).toBe(true);
    });

    it("should include propStatuses", async () => {
      store.updatePropStatus("title", true, false);
      await tick();

      expect(store.status.propStatuses).toHaveLength(1);
      expect(store.status.propStatuses[0].key).toBe("title");
    });
  });
});
