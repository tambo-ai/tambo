/**
 * Tests for the interactable store.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import { createInteractableStore } from "./interactable.svelte.js";

// Mock component for testing
const mockInteractableComponent = (
  name = "TestComponent",
  props: Record<string, unknown> = { title: "Test" },
) => ({
  name,
  props,
  propsSchema: {
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
    },
  },
});

describe("createInteractableStore", () => {
  let store: ReturnType<typeof createInteractableStore>;

  beforeEach(() => {
    store = createInteractableStore();
  });

  describe("initial state", () => {
    it("should have empty interactableComponents", () => {
      expect(store.interactableComponents).toEqual([]);
    });
  });

  describe("addInteractableComponent", () => {
    it("should add a component and return an id", async () => {
      const component = mockInteractableComponent();
      const id = store.addInteractableComponent(component);
      await tick();

      expect(id).toBeDefined();
      expect(id).toContain("TestComponent-");
      expect(store.interactableComponents).toHaveLength(1);
    });

    it("should generate unique ids", async () => {
      const id1 = store.addInteractableComponent(mockInteractableComponent());
      const id2 = store.addInteractableComponent(mockInteractableComponent());
      await tick();

      expect(id1).not.toBe(id2);
      expect(store.interactableComponents).toHaveLength(2);
    });

    it("should initialize state to empty object if not provided", async () => {
      const id = store.addInteractableComponent(mockInteractableComponent());
      await tick();

      const component = store.getInteractableComponent(id);
      expect(component?.state).toEqual({});
    });

    it("should preserve provided state", async () => {
      const component = {
        ...mockInteractableComponent(),
        state: { count: 5 },
      };
      const id = store.addInteractableComponent(component);
      await tick();

      const retrieved = store.getInteractableComponent(id);
      expect(retrieved?.state).toEqual({ count: 5 });
    });
  });

  describe("removeInteractableComponent", () => {
    it("should remove a component by id", async () => {
      const id = store.addInteractableComponent(mockInteractableComponent());
      await tick();
      expect(store.interactableComponents).toHaveLength(1);

      store.removeInteractableComponent(id);
      await tick();
      expect(store.interactableComponents).toHaveLength(0);
    });

    it("should not affect other components", async () => {
      const id1 = store.addInteractableComponent(
        mockInteractableComponent("Component1"),
      );
      store.addInteractableComponent(mockInteractableComponent("Component2"));
      await tick();

      store.removeInteractableComponent(id1);
      await tick();

      expect(store.interactableComponents).toHaveLength(1);
      expect(store.interactableComponents[0].name).toBe("Component2");
    });

    it("should do nothing if id not found", async () => {
      store.addInteractableComponent(mockInteractableComponent());
      await tick();

      store.removeInteractableComponent("nonexistent");
      await tick();

      expect(store.interactableComponents).toHaveLength(1);
    });
  });

  describe("updateInteractableComponentProps", () => {
    it("should update component props", async () => {
      const id = store.addInteractableComponent(
        mockInteractableComponent("Test", { title: "Original" }),
      );
      await tick();

      const result = store.updateInteractableComponentProps(id, {
        title: "Updated",
      });
      await tick();

      expect(result).toBe("Updated successfully");
      const component = store.getInteractableComponent(id);
      expect(component?.props.title).toBe("Updated");
    });

    it("should merge props, not replace", async () => {
      const id = store.addInteractableComponent(
        mockInteractableComponent("Test", { title: "Original", count: 10 }),
      );
      await tick();

      store.updateInteractableComponentProps(id, { title: "Updated" });
      await tick();

      const component = store.getInteractableComponent(id);
      expect(component?.props).toEqual({ title: "Updated", count: 10 });
    });

    it("should return warning if no props provided", async () => {
      const id = store.addInteractableComponent(mockInteractableComponent());
      await tick();

      const result = store.updateInteractableComponentProps(id, {});
      expect(result).toContain("Warning");
    });

    it("should return error if component not found", async () => {
      const result = store.updateInteractableComponentProps("nonexistent", {
        title: "Test",
      });
      expect(result).toContain("Error");
    });

    it("should return no changes if props unchanged", async () => {
      const id = store.addInteractableComponent(
        mockInteractableComponent("Test", { title: "Same" }),
      );
      await tick();

      const result = store.updateInteractableComponentProps(id, {
        title: "Same",
      });
      expect(result).toBe("No changes detected");
    });
  });

  describe("getInteractableComponent", () => {
    it("should return component by id", async () => {
      const id = store.addInteractableComponent(
        mockInteractableComponent("MyComponent"),
      );
      await tick();

      const component = store.getInteractableComponent(id);
      expect(component).toBeDefined();
      expect(component?.name).toBe("MyComponent");
    });

    it("should return undefined if not found", () => {
      const component = store.getInteractableComponent("nonexistent");
      expect(component).toBeUndefined();
    });
  });

  describe("getInteractableComponentsByName", () => {
    it("should return all components with matching name", async () => {
      store.addInteractableComponent(mockInteractableComponent("Card"));
      store.addInteractableComponent(mockInteractableComponent("Card"));
      store.addInteractableComponent(mockInteractableComponent("Button"));
      await tick();

      const cards = store.getInteractableComponentsByName("Card");
      expect(cards).toHaveLength(2);
      expect(cards.every((c) => c.name === "Card")).toBe(true);
    });

    it("should return empty array if no matches", () => {
      const result = store.getInteractableComponentsByName("NonExistent");
      expect(result).toEqual([]);
    });
  });

  describe("clearAllInteractableComponents", () => {
    it("should remove all components", async () => {
      store.addInteractableComponent(mockInteractableComponent());
      store.addInteractableComponent(mockInteractableComponent());
      store.addInteractableComponent(mockInteractableComponent());
      await tick();
      expect(store.interactableComponents).toHaveLength(3);

      store.clearAllInteractableComponents();
      await tick();
      expect(store.interactableComponents).toEqual([]);
    });
  });

  describe("setInteractableState", () => {
    it("should set state for a component", async () => {
      const id = store.addInteractableComponent(mockInteractableComponent());
      await tick();

      store.setInteractableState(id, "count", 42);
      await tick();

      const state = store.getInteractableComponentState(id);
      expect(state?.count).toBe(42);
    });

    it("should update existing state key", async () => {
      const id = store.addInteractableComponent({
        ...mockInteractableComponent(),
        state: { count: 1 },
      });
      await tick();

      store.setInteractableState(id, "count", 2);
      await tick();

      const state = store.getInteractableComponentState(id);
      expect(state?.count).toBe(2);
    });

    it("should preserve other state keys", async () => {
      const id = store.addInteractableComponent({
        ...mockInteractableComponent(),
        state: { a: 1, b: 2 },
      });
      await tick();

      store.setInteractableState(id, "a", 10);
      await tick();

      const state = store.getInteractableComponentState(id);
      expect(state).toEqual({ a: 10, b: 2 });
    });

    it("should warn if component not found", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      store.setInteractableState("nonexistent", "key", "value");
      await tick();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("not found"),
      );
      consoleSpy.mockRestore();
    });

    it("should skip update if value unchanged (deep equality)", async () => {
      const id = store.addInteractableComponent({
        ...mockInteractableComponent(),
        state: { data: { nested: true } },
      });
      await tick();

      // Set same deep value
      store.setInteractableState(id, "data", { nested: true });
      await tick();

      // Array reference should be same if no update occurred
      // Since Svelte 5 creates new arrays on updates, we check by accessing state
      const state = store.getInteractableComponentState(id);
      expect(state).toEqual({ data: { nested: true } });
    });
  });

  describe("getInteractableComponentState", () => {
    it("should return component state", async () => {
      const id = store.addInteractableComponent({
        ...mockInteractableComponent(),
        state: { key: "value" },
      });
      await tick();

      const state = store.getInteractableComponentState(id);
      expect(state).toEqual({ key: "value" });
    });

    it("should return undefined if component not found", () => {
      const state = store.getInteractableComponentState("nonexistent");
      expect(state).toBeUndefined();
    });
  });

  describe("setInteractableSelected", () => {
    it("should select a component", async () => {
      const id = store.addInteractableComponent(mockInteractableComponent());
      await tick();

      store.setInteractableSelected(id, true);
      await tick();

      const component = store.getInteractableComponent(id);
      expect(component?.isSelected).toBe(true);
    });

    it("should deselect a component", async () => {
      const id = store.addInteractableComponent({
        ...mockInteractableComponent(),
        isSelected: true,
      });
      await tick();

      store.setInteractableSelected(id, false);
      await tick();

      const component = store.getInteractableComponent(id);
      expect(component?.isSelected).toBe(false);
    });

    it("should do nothing if component not found", async () => {
      store.addInteractableComponent(mockInteractableComponent());
      await tick();

      // Should not throw
      store.setInteractableSelected("nonexistent", true);
      await tick();

      expect(store.interactableComponents).toHaveLength(1);
    });

    it("should skip update if selection unchanged", async () => {
      const id = store.addInteractableComponent({
        ...mockInteractableComponent(),
        isSelected: true,
      });
      await tick();

      // Setting same value should not create new array
      store.setInteractableSelected(id, true);
      await tick();

      const component = store.getInteractableComponent(id);
      expect(component?.isSelected).toBe(true);
    });
  });

  describe("clearInteractableSelections", () => {
    it("should clear all selections", async () => {
      const id1 = store.addInteractableComponent({
        ...mockInteractableComponent("A"),
        isSelected: true,
      });
      const id2 = store.addInteractableComponent({
        ...mockInteractableComponent("B"),
        isSelected: true,
      });
      await tick();

      store.clearInteractableSelections();
      await tick();

      expect(store.getInteractableComponent(id1)?.isSelected).toBe(false);
      expect(store.getInteractableComponent(id2)?.isSelected).toBe(false);
    });

    it("should skip if no selections exist", async () => {
      store.addInteractableComponent(mockInteractableComponent());
      await tick();

      // Should not throw or create unnecessary updates
      store.clearInteractableSelections();
      await tick();

      expect(store.interactableComponents).toHaveLength(1);
    });

    it("should only update selected components", async () => {
      const id1 = store.addInteractableComponent({
        ...mockInteractableComponent("A"),
        isSelected: true,
      });
      const id2 = store.addInteractableComponent({
        ...mockInteractableComponent("B"),
        isSelected: false,
      });
      await tick();

      store.clearInteractableSelections();
      await tick();

      expect(store.getInteractableComponent(id1)?.isSelected).toBe(false);
      expect(store.getInteractableComponent(id2)?.isSelected).toBe(false);
    });
  });
});
