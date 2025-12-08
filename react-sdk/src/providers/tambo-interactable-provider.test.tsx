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
