import { act, renderHook } from "@testing-library/react";
import React from "react";
import { z } from "zod";
import { TamboInteractableComponent } from "../model/tambo-interactable";
import {
  TamboInteractableProvider,
  useTamboInteractable,
} from "./tambo-interactable-provider";

// Mock the context helpers
const mockAddContextHelper = jest.fn();
const mockRemoveContextHelper = jest.fn();

jest.mock("./tambo-context-helpers-provider", () => ({
  TamboContextHelpersProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <>{children}</>,
  useTamboContextHelpers: () => ({
    addContextHelper: mockAddContextHelper,
    removeContextHelper: mockRemoveContextHelper,
  }),
}));

// Mock the component provider
const mockRegisterTool = jest.fn();

jest.mock("./tambo-component-provider", () => ({
  useTamboComponent: () => ({
    registerTool: mockRegisterTool,
  }),
}));

// Mock the context helper creation
jest.mock("../context-helpers/current-interactables-context-helper", () => ({
  createInteractablesContextHelper: () =>
    jest.fn(() => ({
      name: "interactables",
      context: {
        description: "Test interactables context",
        components: [],
      },
    })),
}));

describe("TamboInteractableProvider - State Tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TamboInteractableProvider>{children}</TamboInteractableProvider>
  );

  it("should set and get state for a component", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "TestComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: { title: "Test" },
      propsSchema: z.object({ title: z.string() }),
    };

    let componentId = "";
    act(() => {
      componentId = result.current.addInteractableComponent(component);
    });

    act(() => {
      result.current.setInteractableState(componentId, "count", 10);
    });

    const state = result.current.getInteractableComponentState(componentId);
    expect(state).toEqual({ count: 10 });
  });
});

describe("TamboInteractableProvider - State Update Tool Registration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TamboInteractableProvider>{children}</TamboInteractableProvider>
  );

  it("should register both prop and state update tools when component is added", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "TestComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: { title: "Test" },
      propsSchema: z.object({ title: z.string() }),
    };

    let componentId = "";
    act(() => {
      componentId = result.current.addInteractableComponent(component);
    });

    // Should register both update_component_ and update_component_state_ tools
    const registeredToolNames = mockRegisterTool.mock.calls.map(
      (call) => call[0].name,
    );
    expect(registeredToolNames).toContain(
      `update_component_props_${componentId}`,
    );
    expect(registeredToolNames).toContain(
      `update_component_state_${componentId}`,
    );
  });

  it("should register state update tool with correct description", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "MyComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: {},
    };

    let componentId = "";
    act(() => {
      componentId = result.current.addInteractableComponent(component);
    });

    const stateToolCall = mockRegisterTool.mock.calls.find((call) =>
      call[0].name.startsWith("update_component_state_"),
    );

    expect(stateToolCall).toBeDefined();
    expect(stateToolCall[0].description).toContain(componentId);
    expect(stateToolCall[0].description).toContain("MyComponent");
  });

  it("should allow state update tool to update multiple state values", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "TestComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: {},
    };

    let componentId = "";
    act(() => {
      componentId = result.current.addInteractableComponent(component);
    });

    // Find the state update tool and call it
    const stateToolCall = mockRegisterTool.mock.calls.find((call) =>
      call[0].name.startsWith("update_component_state_"),
    );

    const toolFn = stateToolCall[0].tool;

    act(() => {
      toolFn({ componentId, newState: { count: 5, name: "test" } });
    });

    const state = result.current.getInteractableComponentState(componentId);
    expect(state).toEqual({ count: 5, name: "test" });
  });

  it("should preserve existing state when updating partial state", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "TestComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: {},
    };

    let componentId = "";
    act(() => {
      componentId = result.current.addInteractableComponent(component);
    });

    // Set initial state
    act(() => {
      result.current.setInteractableState(componentId, "existingKey", "value1");
    });

    // Find the state update tool and call it with a new key
    const stateToolCall = mockRegisterTool.mock.calls.find((call) =>
      call[0].name.startsWith("update_component_state_"),
    );

    const toolFn = stateToolCall[0].tool;

    act(() => {
      toolFn({ componentId, newState: { newKey: "value2" } });
    });

    const state = result.current.getInteractableComponentState(componentId);
    expect(state).toEqual({ existingKey: "value1", newKey: "value2" });
  });

  it("should use stateSchema when provided for tool registration", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const stateSchema = z.object({
      count: z.number(),
      name: z.string(),
    });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "TestComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: {},
      stateSchema,
    };

    act(() => {
      result.current.addInteractableComponent(component);
    });

    // Find the state update tool
    const stateToolCall = mockRegisterTool.mock.calls.find((call) =>
      call[0].name.startsWith("update_component_state_"),
    );

    expect(stateToolCall).toBeDefined();
    // The inputSchema should contain the partial stateSchema
    expect(stateToolCall[0].inputSchema).toBeDefined();
  });

  it("should return warning when updating state with empty object", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "TestComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: {},
    };

    let componentId = "";
    act(() => {
      componentId = result.current.addInteractableComponent(component);
    });

    // Find the state update tool and call it with empty state
    const stateToolCall = mockRegisterTool.mock.calls.find((call) =>
      call[0].name.startsWith("update_component_state_"),
    );

    const toolFn = stateToolCall[0].tool;

    let updateResult = "";
    act(() => {
      updateResult = toolFn({ componentId, newState: {} });
    });

    expect(updateResult).toContain("Warning");
    expect(updateResult).toContain("No state values provided");
  });

  it("should preserve stateSchema in interactable component", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const stateSchema = z.object({
      count: z.number(),
    });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "TestComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: {},
      stateSchema,
    };

    let componentId = "";
    act(() => {
      componentId = result.current.addInteractableComponent(component);
    });

    const interactable = result.current.getInteractableComponent(componentId);
    expect(interactable?.stateSchema).toBe(stateSchema);
  });

  it("should convert stateSchema to partial JSON Schema (no required fields)", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const stateSchema = z.object({
      count: z.number(),
      name: z.string(),
    });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "TestComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: {},
      stateSchema,
    };

    act(() => {
      result.current.addInteractableComponent(component);
    });

    // Find the state update tool
    const stateToolCall = mockRegisterTool.mock.calls.find((call) =>
      call[0].name.startsWith("update_component_state_"),
    );

    expect(stateToolCall).toBeDefined();
    const inputSchema = stateToolCall[0].inputSchema;

    // The newState property should not have required fields (partial schema)
    expect(inputSchema.properties.newState).toBeDefined();
    expect(inputSchema.properties.newState.required).toBeUndefined();
    // But it should have the properties from the schema
    expect(inputSchema.properties.newState.properties).toBeDefined();
  });

  it("should use additionalProperties when no stateSchema provided", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "TestComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: {},
      // No stateSchema
    };

    act(() => {
      result.current.addInteractableComponent(component);
    });

    // Find the state update tool
    const stateToolCall = mockRegisterTool.mock.calls.find((call) =>
      call[0].name.startsWith("update_component_state_"),
    );

    expect(stateToolCall).toBeDefined();
    const inputSchema = stateToolCall[0].inputSchema;

    // The newState property should allow additional properties
    expect(inputSchema.properties.newState.additionalProperties).toBe(true);
  });

  it("should convert propsSchema to partial JSON Schema for props update tool", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const propsSchema = z.object({
      title: z.string(),
      count: z.number(),
    });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "TestComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: { title: "test", count: 0 },
      propsSchema,
    };

    act(() => {
      result.current.addInteractableComponent(component);
    });

    // Find the props update tool (not the state one)
    const propsToolCall = mockRegisterTool.mock.calls.find(
      (call) =>
        call[0].name.startsWith("update_component_") &&
        !call[0].name.includes("state"),
    );

    expect(propsToolCall).toBeDefined();
    const inputSchema = propsToolCall[0].inputSchema;

    // The newProps property should not have required fields (partial schema)
    expect(inputSchema.properties.newProps).toBeDefined();
    expect(inputSchema.properties.newProps.required).toBeUndefined();
    // But it should have the properties from the schema
    expect(inputSchema.properties.newProps.properties).toBeDefined();
  });

  it("should use additionalProperties when no propsSchema provided", () => {
    const { result } = renderHook(() => useTamboInteractable(), { wrapper });

    const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
      name: "TestComponent",
      description: "A test component",
      component: () => <div>Test</div>,
      props: { title: "test" },
      // No propsSchema
    };

    act(() => {
      result.current.addInteractableComponent(component);
    });

    // Find the props update tool
    const propsToolCall = mockRegisterTool.mock.calls.find(
      (call) =>
        call[0].name.startsWith("update_component_") &&
        !call[0].name.includes("state"),
    );

    expect(propsToolCall).toBeDefined();
    const inputSchema = propsToolCall[0].inputSchema;

    // The newProps property should allow additional properties
    expect(inputSchema.properties.newProps.additionalProperties).toBe(true);
  });
});
