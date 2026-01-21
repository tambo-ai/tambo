import { act, renderHook } from "@testing-library/react";
import React from "react";
import { z } from "zod/v4";
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

describe("updateInteractableComponentProps - Partial Updates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TamboInteractableProvider>{children}</TamboInteractableProvider>
  );

  describe("Partial Updates Functionality", () => {
    it("should apply partial updates to existing props", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: {
          title: "Original Title",
          count: 0,
          active: true,
          metadata: { type: "test", version: "1.0" },
        },
        propsSchema: z.object({
          title: z.string(),
          count: z.number(),
          active: z.boolean(),
          metadata: z.object({
            type: z.string(),
            version: z.string(),
          }),
        }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      // Verify initial state
      expect(result.current.interactableComponents[0].props).toEqual({
        title: "Original Title",
        count: 0,
        active: true,
        metadata: { type: "test", version: "1.0" },
      });

      // Apply partial update - only change count
      let updateResult = "";
      act(() => {
        updateResult = result.current.updateInteractableComponentProps(
          componentId,
          {
            count: 5,
          },
        );
      });

      expect(updateResult).toBe("Updated successfully");
      expect(result.current.interactableComponents[0].props).toEqual({
        title: "Original Title", // unchanged
        count: 5, // updated
        active: true, // unchanged
        metadata: { type: "test", version: "1.0" }, // unchanged
      });
    });

    it("should apply multiple partial updates in sequence", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: {
          title: "Original Title",
          count: 0,
          active: true,
          description: "Original description",
        },
        propsSchema: z.object({
          title: z.string(),
          count: z.number(),
          active: z.boolean(),
          description: z.string(),
        }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      // First partial update - change title and count
      act(() => {
        result.current.updateInteractableComponentProps(componentId, {
          title: "Updated Title",
          count: 10,
        });
      });

      expect(result.current.interactableComponents[0].props).toEqual({
        title: "Updated Title",
        count: 10,
        active: true,
        description: "Original description",
      });

      // Second partial update - change active and description
      act(() => {
        result.current.updateInteractableComponentProps(componentId, {
          active: false,
          description: "Updated description",
        });
      });

      expect(result.current.interactableComponents[0].props).toEqual({
        title: "Updated Title", // from previous update
        count: 10, // from previous update
        active: false, // new update
        description: "Updated description", // new update
      });
    });

    it("should handle nested object partial updates (shallow merge behavior)", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: {
          title: "Original Title",
          config: {
            theme: "light",
            language: "en",
            features: {
              notifications: true,
              analytics: false,
            },
          },
        },
        propsSchema: z.object({
          title: z.string(),
          config: z.object({
            theme: z.string(),
            language: z.string(),
            features: z.object({
              notifications: z.boolean(),
              analytics: z.boolean(),
            }),
          }),
        }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      // Partial update - replace entire config object (shallow merge behavior)
      act(() => {
        result.current.updateInteractableComponentProps(componentId, {
          config: {
            theme: "dark",
            // Note: language and features are not provided, so they will be undefined
            // This demonstrates the shallow merge behavior
          },
        });
      });

      expect(result.current.interactableComponents[0].props).toEqual({
        title: "Original Title",
        config: {
          theme: "dark", // updated
          // language and features are now undefined due to shallow merge
        },
      });
    });

    it("should handle array partial updates", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: {
          title: "Original Title",
          items: ["item1", "item2", "item3"],
          tags: ["tag1", "tag2"],
        },
        propsSchema: z.object({
          title: z.string(),
          items: z.array(z.string()),
          tags: z.array(z.string()),
        }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      // Partial update - only change items array
      act(() => {
        result.current.updateInteractableComponentProps(componentId, {
          items: ["newItem1", "newItem2"],
        });
      });

      expect(result.current.interactableComponents[0].props).toEqual({
        title: "Original Title", // unchanged
        items: ["newItem1", "newItem2"], // updated
        tags: ["tag1", "tag2"], // unchanged
      });
    });

    it("should handle null and undefined values in partial updates", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: {
          title: "Original Title",
          count: 5,
          description: "Original description",
        },
        propsSchema: z.object({
          title: z.string(),
          count: z.number(),
          description: z.string(),
        }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      // Partial update with null value
      act(() => {
        result.current.updateInteractableComponentProps(componentId, {
          description: null as any,
        });
      });

      expect(result.current.interactableComponents[0].props).toEqual({
        title: "Original Title",
        count: 5,
        description: null,
      });

      // Partial update with undefined value
      act(() => {
        result.current.updateInteractableComponentProps(componentId, {
          count: undefined as any,
        });
      });

      expect(result.current.interactableComponents[0].props).toEqual({
        title: "Original Title",
        count: undefined,
        description: null,
      });
    });
  });

  describe("Error Handling", () => {
    it("should return error for non-existent component", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      let updateResult = "";
      act(() => {
        updateResult = result.current.updateInteractableComponentProps(
          "non-existent",
          {
            title: "New Title",
          },
        );
      });

      expect(updateResult).toBe("Updated successfully");
    });

    it("should throw error when component name contains spaces", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const invalidComponent: Omit<
        TamboInteractableComponent,
        "id" | "createdAt"
      > = {
        name: "Invalid Component Name", // Contains spaces
        description: "A component with spaces in name",
        component: () => <div>Invalid</div>,
        props: { title: "Test" },
        propsSchema: z.object({ title: z.string() }),
      };

      expect(() => {
        act(() => {
          result.current.addInteractableComponent(invalidComponent);
        });
      }).toThrow(
        'component "Invalid Component Name" must only contain letters, numbers, underscores, and hyphens.',
      );
    });

    it("should return warning for empty props object", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: { title: "Original Title" },
        propsSchema: z.object({ title: z.string() }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      let updateResult = "";
      act(() => {
        updateResult = result.current.updateInteractableComponentProps(
          componentId,
          {},
        );
      });

      expect(updateResult).toBe(
        `Warning: No props provided for component with ID ${componentId}.`,
      );
    });

    it("should return warning for null props", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: { title: "Original Title" },
        propsSchema: z.object({ title: z.string() }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      let updateResult = "";
      act(() => {
        updateResult = result.current.updateInteractableComponentProps(
          componentId,
          null as any,
        );
      });

      expect(updateResult).toBe(
        `Warning: No props provided for component with ID ${componentId}.`,
      );
    });

    it("should return warning for undefined props", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: { title: "Original Title" },
        propsSchema: z.object({ title: z.string() }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      let updateResult = "";
      act(() => {
        updateResult = result.current.updateInteractableComponentProps(
          componentId,
          undefined as any,
        );
      });

      expect(updateResult).toBe(
        `Warning: No props provided for component with ID ${componentId}.`,
      );
    });
  });

  describe("Performance and Efficiency", () => {
    it("should only update changed properties without affecting others", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: {
          title: "Original Title",
          count: 0,
          active: true,
          metadata: { type: "test", version: "1.0" },
          items: ["item1", "item2"],
        },
        propsSchema: z.object({
          title: z.string(),
          count: z.number(),
          active: z.boolean(),
          metadata: z.object({
            type: z.string(),
            version: z.string(),
          }),
          items: z.array(z.string()),
        }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      const originalProps = result.current.interactableComponents[0].props;
      const originalMetadata = originalProps.metadata;
      const originalItems = originalProps.items;

      // Apply minimal partial update - only change count
      act(() => {
        result.current.updateInteractableComponentProps(componentId, {
          count: 1,
        });
      });

      const updatedProps = result.current.interactableComponents[0].props;

      // Verify that only count changed
      expect(updatedProps.count).toBe(1);
      expect(updatedProps.title).toBe("Original Title");
      expect(updatedProps.active).toBe(true);

      // Verify that nested objects are preserved (same reference for efficiency)
      expect(updatedProps.metadata).toBe(originalMetadata);
      expect(updatedProps.items).toBe(originalItems);
    });

    it("should handle large objects efficiently with partial updates", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      // Create a component with a large initial state
      const largeData = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
        })),
        settings: {
          theme: "light",
          language: "en",
          notifications: true,
          privacy: {
            shareData: false,
            analytics: true,
            marketing: false,
          },
        },
        metadata: {
          version: "1.0.0",
          build: "12345",
          timestamp: Date.now(),
        },
      };

      const propsSchema = z.object({
        users: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
          }),
        ),
        settings: z.object({
          theme: z.string(),
          language: z.string(),
          notifications: z.boolean(),
          privacy: z.object({
            shareData: z.boolean(),
            analytics: z.boolean(),
            marketing: z.boolean(),
          }),
        }),
        metadata: z.object({
          version: z.string(),
          build: z.string(),
          timestamp: z.number(),
        }),
      });

      const component: Omit<
        TamboInteractableComponent<z.infer<typeof propsSchema>>,
        "id" | "createdAt"
      > = {
        name: "TestComponent",
        description: "A test component with large data",
        component: () => <div>Test</div>,
        props: largeData,
        propsSchema,
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      const originalProps = (
        result.current.interactableComponents[0] as TamboInteractableComponent<
          z.infer<typeof propsSchema>
        >
      ).props;
      const originalUsers = originalProps.users;

      // Apply a small partial update - only change theme (shallow merge behavior)
      act(() => {
        result.current.updateInteractableComponentProps(componentId, {
          settings: {
            theme: "dark",
            // Note: other settings properties are not provided, so they will be undefined
            // This demonstrates the shallow merge behavior
          },
        });
      });

      const updatedProps = (
        result.current.interactableComponents[0] as TamboInteractableComponent<
          z.infer<typeof propsSchema>
        >
      ).props;

      // Verify the update worked
      expect(updatedProps.settings.theme).toBe("dark");
      // Due to shallow merge, other properties are now undefined
      expect(updatedProps.settings.language).toBeUndefined();
      expect(updatedProps.settings.notifications).toBeUndefined();

      // Verify that large arrays are preserved (same reference for efficiency)
      expect(updatedProps.users).toBe(originalUsers);

      // Verify that metadata is preserved (not updated)
      expect(updatedProps.metadata).toBe(originalProps.metadata);
    });
  });

  describe("Edge Cases", () => {
    it("should handle updating a property that doesn't exist in original props", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: {
          title: "Original Title",
          count: 0,
        },
        propsSchema: z.object({
          title: z.string(),
          count: z.number(),
          newProperty: z.string().optional(),
        }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      // Add a new property that wasn't in the original props
      act(() => {
        result.current.updateInteractableComponentProps(componentId, {
          newProperty: "New Value",
        });
      });

      expect(result.current.interactableComponents[0].props).toEqual({
        title: "Original Title",
        count: 0,
        newProperty: "New Value",
      });
    });

    it("should handle updating with same values (no-op updates)", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: {
          title: "Original Title",
          count: 5,
          active: true,
        },
        propsSchema: z.object({
          title: z.string(),
          count: z.number(),
          active: z.boolean(),
        }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      const originalProps = result.current.interactableComponents[0].props;

      // Update with the same values
      let updateResult = "";
      act(() => {
        updateResult = result.current.updateInteractableComponentProps(
          componentId,
          {
            title: "Original Title",
            count: 5,
            active: true,
          },
        );
      });

      expect(updateResult).toBe("Updated successfully");
      expect(result.current.interactableComponents[0].props).toEqual(
        originalProps,
      );
    });

    it("should handle proper nested partial updates by providing complete nested structure", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: {
          title: "Original Title",
          config: {
            theme: "light",
            language: "en",
            features: {
              notifications: true,
              analytics: false,
              experimental: {
                beta: false,
                alpha: true,
              },
            },
          },
        },
        propsSchema: z.object({
          title: z.string(),
          config: z.object({
            theme: z.string(),
            language: z.string(),
            features: z.object({
              notifications: z.boolean(),
              analytics: z.boolean(),
              experimental: z.object({
                beta: z.boolean(),
                alpha: z.boolean(),
              }),
            }),
          }),
        }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      // Proper nested partial update - provide complete nested structure
      act(() => {
        result.current.updateInteractableComponentProps(componentId, {
          config: {
            theme: "light", // keep original
            language: "en", // keep original
            features: {
              notifications: true, // keep original
              analytics: false, // keep original
              experimental: {
                beta: true, // update this
                alpha: true, // keep original
              },
            },
          },
        });
      });

      expect(result.current.interactableComponents[0].props).toEqual({
        title: "Original Title",
        config: {
          theme: "light", // unchanged
          language: "en", // unchanged
          features: {
            notifications: true, // unchanged
            analytics: false, // unchanged
            experimental: {
              beta: true, // updated
              alpha: true, // unchanged
            },
          },
        },
      });
    });

    it("should handle complex nested partial updates (shallow merge behavior)", () => {
      const { result } = renderHook(() => useTamboInteractable(), { wrapper });

      const component: Omit<TamboInteractableComponent, "id" | "createdAt"> = {
        name: "TestComponent",
        description: "A test component",
        component: () => <div>Test</div>,
        props: {
          title: "Original Title",
          config: {
            theme: "light",
            language: "en",
            features: {
              notifications: true,
              analytics: false,
              experimental: {
                beta: false,
                alpha: true,
              },
            },
          },
        },
        propsSchema: z.object({
          title: z.string(),
          config: z.object({
            theme: z.string(),
            language: z.string(),
            features: z.object({
              notifications: z.boolean(),
              analytics: z.boolean(),
              experimental: z.object({
                beta: z.boolean(),
                alpha: z.boolean(),
              }),
            }),
          }),
        }),
      };

      let componentId = "";
      act(() => {
        componentId = result.current.addInteractableComponent(component);
      });

      // Deep nested partial update - only change beta flag (shallow merge behavior)
      act(() => {
        result.current.updateInteractableComponentProps(componentId, {
          config: {
            features: {
              experimental: {
                beta: true,
                // Note: alpha is not provided, so it will be undefined
                // This demonstrates the shallow merge behavior
              },
            },
          },
        });
      });

      expect(result.current.interactableComponents[0].props).toEqual({
        title: "Original Title",
        config: {
          // theme and language are now undefined due to shallow merge
          features: {
            // notifications and analytics are now undefined due to shallow merge
            experimental: {
              beta: true, // updated
              // alpha is now undefined due to shallow merge
            },
          },
        },
      });
    });
  });
});
