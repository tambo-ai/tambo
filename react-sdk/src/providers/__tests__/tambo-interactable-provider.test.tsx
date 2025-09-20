import { act, renderHook } from "@testing-library/react";
import React from "react";
import { z } from "zod";
import { TamboComponent } from "../../model/component-metadata";
import {
  TamboInteractableProvider,
  useTamboInteractable,
} from "../tambo-interactable-provider";

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: jest.fn().mockReturnValue("test-uuid"),
  },
});

// Mock the required providers
jest.mock("../tambo-component-provider", () => ({
  useTamboComponent: jest.fn(() => ({
    registerTool: jest.fn(),
  })),
}));

describe("TamboInteractableProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const TestComponent: React.FC<{ title: string }> = ({ title }) => (
    <div>{title}</div>
  );

  const _testComponent: TamboComponent = {
    name: "TestComponent",
    description: "A test component",
    component: TestComponent,
    propsSchema: z.object({
      title: z.string(),
    }),
  };

  const wrapper = ({
    children,
    autoInteractables = false,
  }: {
    children: React.ReactNode;
    autoInteractables?: boolean;
  }) => (
    <TamboInteractableProvider autoInteractables={autoInteractables}>
      {children}
    </TamboInteractableProvider>
  );

  it("should provide interactable context with default values", () => {
    const { result } = renderHook(() => useTamboInteractable(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    expect(result.current.interactableComponents).toEqual([]);
    expect(result.current.autoInteractables).toBe(false);
    expect(typeof result.current.addInteractableComponent).toBe("function");
    expect(typeof result.current.removeInteractableComponent).toBe("function");
    expect(typeof result.current.updateInteractableComponentProps).toBe(
      "function",
    );
    expect(typeof result.current.getInteractableComponent).toBe("function");
    expect(typeof result.current.getInteractableComponentsByName).toBe(
      "function",
    );
    expect(typeof result.current.clearAllInteractableComponents).toBe(
      "function",
    );
  });

  it("should respect autoInteractables prop", () => {
    const { result } = renderHook(() => useTamboInteractable(), {
      wrapper: ({ children }) => wrapper({ children, autoInteractables: true }),
    });

    expect(result.current.autoInteractables).toBe(true);
  });

  it("should add interactable component", () => {
    const { result } = renderHook(() => useTamboInteractable(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    act(() => {
      const id = result.current.addInteractableComponent({
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { title: "Test" },
        propsSchema: z.object({
          title: z.string(),
        }),
      });

      expect(id).toBe("TestComponent-test-uuid");
    });

    expect(result.current.interactableComponents).toHaveLength(1);
    expect(result.current.interactableComponents[0].name).toBe("TestComponent");
    expect(result.current.interactableComponents[0].props).toEqual({
      title: "Test",
    });
  });

  it("should remove interactable component", () => {
    const { result } = renderHook(() => useTamboInteractable(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    act(() => {
      const id = result.current.addInteractableComponent({
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { title: "Test" },
      });

      result.current.removeInteractableComponent(id);
    });

    expect(result.current.interactableComponents).toHaveLength(0);
  });

  it("should update interactable component props", () => {
    const { result } = renderHook(() => useTamboInteractable(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    act(() => {
      const id = result.current.addInteractableComponent({
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { title: "Test" },
      });

      result.current.updateInteractableComponentProps(id, { title: "Updated" });
    });

    expect(result.current.interactableComponents[0].props).toEqual({
      title: "Updated",
    });
  });

  it("should get interactable component by id", () => {
    const { result } = renderHook(() => useTamboInteractable(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    let componentId: string;

    act(() => {
      componentId = result.current.addInteractableComponent({
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { title: "Test" },
      });
    });

    const component = result.current.getInteractableComponent(componentId!);
    expect(component?.name).toBe("TestComponent");
    expect(component?.props).toEqual({ title: "Test" });
  });

  it("should get interactable components by name", () => {
    const { result } = renderHook(() => useTamboInteractable(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    act(() => {
      result.current.addInteractableComponent({
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { title: "Test 1" },
      });

      result.current.addInteractableComponent({
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { title: "Test 2" },
      });
    });

    const components =
      result.current.getInteractableComponentsByName("TestComponent");
    expect(components).toHaveLength(2);
    expect(components[0].props).toEqual({ title: "Test 1" });
    expect(components[1].props).toEqual({ title: "Test 2" });
  });

  it("should clear all interactable components", () => {
    const { result } = renderHook(() => useTamboInteractable(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    act(() => {
      result.current.addInteractableComponent({
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { title: "Test 1" },
      });

      result.current.addInteractableComponent({
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { title: "Test 2" },
      });

      result.current.clearAllInteractableComponents();
    });

    expect(result.current.interactableComponents).toHaveLength(0);
  });
});
