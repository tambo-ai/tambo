/**
 * Tests for the registry store.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import { createRegistryStore } from "./registry.svelte.js";
import type { TamboComponent, TamboTool } from "../types.js";

// Mock component for testing
const mockComponent = (): TamboComponent => ({
  name: "TestComponent",
  description: "A test component",
  component: {} as TamboComponent["component"],
  propsSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "The title" },
      count: { type: "number", description: "The count" },
    },
    required: ["title"],
  },
});

// Mock tool for testing
const mockTool = (): TamboTool => ({
  name: "testTool",
  description: "A test tool",
  tool: vi.fn().mockResolvedValue({ result: "success" }),
  inputSchema: {
    type: "object",
    properties: {
      input: { type: "string", description: "Input value" },
    },
    required: ["input"],
  },
});

describe("createRegistryStore", () => {
  let store: ReturnType<typeof createRegistryStore>;

  beforeEach(() => {
    store = createRegistryStore();
  });

  describe("initial state", () => {
    it("should have empty componentRegistry", () => {
      expect(store.componentRegistry).toEqual({});
    });

    it("should have empty toolRegistry", () => {
      expect(store.toolRegistry).toEqual({});
    });

    it("should have empty toolAssociations", () => {
      expect(store.toolAssociations).toEqual({});
    });
  });

  describe("registerComponent", () => {
    it("should register a component", async () => {
      const component = mockComponent();
      store.registerComponent(component);
      await tick();

      expect(store.componentRegistry["TestComponent"]).toBeDefined();
      expect(store.componentRegistry["TestComponent"].name).toBe(
        "TestComponent",
      );
      expect(store.componentRegistry["TestComponent"].description).toBe(
        "A test component",
      );
    });

    it("should convert propsSchema to JSON Schema format", async () => {
      const component = mockComponent();
      store.registerComponent(component);
      await tick();

      const registered = store.componentRegistry["TestComponent"];
      expect(registered.props).toBeDefined();
      expect(registered.props?.type).toBe("object");
    });

    it("should register associated tools", async () => {
      const tool = mockTool();
      const component: TamboComponent = {
        ...mockComponent(),
        associatedTools: [tool],
      };

      store.registerComponent(component);
      await tick();

      expect(store.toolRegistry["testTool"]).toBeDefined();
      expect(store.toolAssociations["TestComponent"]).toContain("testTool");
    });
  });

  describe("registerComponents", () => {
    it("should register multiple components", async () => {
      const component1 = mockComponent();
      const component2 = { ...mockComponent(), name: "Component2" };

      store.registerComponents([component1, component2]);
      await tick();

      expect(store.componentRegistry["TestComponent"]).toBeDefined();
      expect(store.componentRegistry["Component2"]).toBeDefined();
    });
  });

  describe("registerTool", () => {
    it("should register a tool", async () => {
      const tool = mockTool();
      store.registerTool(tool);
      await tick();

      expect(store.toolRegistry["testTool"]).toBeDefined();
      expect(store.toolRegistry["testTool"].description).toBe("A test tool");
    });

    it("should warn on overwrite by default", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const tool = mockTool();

      store.registerTool(tool);
      store.registerTool(tool);
      await tick();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Tool "testTool" is being overwritten',
      );
      consoleSpy.mockRestore();
    });

    it("should not warn when warnOnOverwrite is false", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const tool = mockTool();

      store.registerTool(tool, false);
      store.registerTool(tool, false);
      await tick();

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("registerTools", () => {
    it("should register multiple tools", async () => {
      const tool1 = mockTool();
      const tool2 = { ...mockTool(), name: "tool2" };

      store.registerTools([tool1, tool2]);
      await tick();

      expect(store.toolRegistry["testTool"]).toBeDefined();
      expect(store.toolRegistry["tool2"]).toBeDefined();
    });
  });

  describe("getComponent", () => {
    it("should return registered component", async () => {
      const component = mockComponent();
      store.registerComponent(component);
      await tick();

      const result = store.getComponent("TestComponent");
      expect(result).toBeDefined();
      expect(result?.name).toBe("TestComponent");
    });

    it("should return undefined for unregistered component", () => {
      const result = store.getComponent("NonExistent");
      expect(result).toBeUndefined();
    });
  });

  describe("getTool", () => {
    it("should return registered tool", async () => {
      const tool = mockTool();
      store.registerTool(tool);
      await tick();

      const result = store.getTool("testTool");
      expect(result).toBeDefined();
      expect(result?.name).toBe("testTool");
    });

    it("should return undefined for unregistered tool", () => {
      const result = store.getTool("NonExistent");
      expect(result).toBeUndefined();
    });
  });

  describe("associateToolWithComponent", () => {
    it("should associate a tool with a component", async () => {
      store.associateToolWithComponent("MyComponent", "myTool");
      await tick();

      expect(store.toolAssociations["MyComponent"]).toContain("myTool");
    });

    it("should not duplicate associations", async () => {
      store.associateToolWithComponent("MyComponent", "myTool");
      store.associateToolWithComponent("MyComponent", "myTool");
      await tick();

      expect(store.toolAssociations["MyComponent"]).toEqual(["myTool"]);
    });

    it("should allow multiple tools per component", async () => {
      store.associateToolWithComponent("MyComponent", "tool1");
      store.associateToolWithComponent("MyComponent", "tool2");
      await tick();

      expect(store.toolAssociations["MyComponent"]).toEqual(["tool1", "tool2"]);
    });
  });

  describe("getAvailableComponents", () => {
    it("should return array of available components", async () => {
      store.registerComponent(mockComponent());
      await tick();

      const available = store.getAvailableComponents();

      expect(available).toHaveLength(1);
      expect(available[0].name).toBe("TestComponent");
      expect(available[0].description).toBe("A test component");
    });

    it("should include context tools for associated tools", async () => {
      const tool = mockTool();
      const component: TamboComponent = {
        ...mockComponent(),
        associatedTools: [tool],
      };

      store.registerComponent(component);
      await tick();

      const available = store.getAvailableComponents();

      expect(available[0].contextTools).toHaveLength(1);
      expect(available[0].contextTools[0].name).toBe("testTool");
    });
  });

  describe("getClientTools", () => {
    it("should return tools not associated with any component", async () => {
      const tool = mockTool();
      store.registerTool(tool);
      await tick();

      const clientTools = store.getClientTools();

      expect(clientTools).toHaveLength(1);
      expect(clientTools[0].name).toBe("testTool");
    });

    it("should not return associated tools", async () => {
      const tool = mockTool();
      const component: TamboComponent = {
        ...mockComponent(),
        associatedTools: [tool],
      };

      store.registerComponent(component);
      await tick();

      const clientTools = store.getClientTools();

      expect(clientTools).toHaveLength(0);
    });
  });
});
