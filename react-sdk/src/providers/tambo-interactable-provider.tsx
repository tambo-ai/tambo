// react-sdk/src/providers/tambo-interactable-provider.tsx
"use client";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { z } from "zod";
import { createInteractablesContextHelper } from "../context-helpers/current-interactables-context-helper";
import {
  TamboInteractableComponent,
  type TamboInteractableContext,
} from "../model/tambo-interactable";
import { assertValidName } from "../util/validate-component-name";
import { useTamboComponent } from "./tambo-component-provider";
import { useTamboContextHelpers } from "./tambo-context-helpers-provider";

const TamboInteractableContext = createContext<TamboInteractableContext>({
  interactableComponents: [],
  addInteractableComponent: () => "",
  removeInteractableComponent: () => {},
  updateInteractableComponentProps: () => "",
  getInteractableComponent: () => undefined,
  getInteractableComponentsByName: () => [],
  clearAllInteractableComponents: () => {},
});

/**
 * The TamboInteractableProvider manages a list of components that are currently
 * interactable, allowing tambo to interact with them by updating their props. It also registers tools
 * for Tambo to perform CRUD operations on the components list.
 * @param props - The props for the TamboInteractableProvider
 * @param props.children - The children to wrap
 * @returns The TamboInteractableProvider component
 */
export const TamboInteractableProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [interactableComponents, setInteractableComponents] = useState<
    TamboInteractableComponent[]
  >([]);
  const { registerTool } = useTamboComponent();
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

  // Create a stable context helper function
  const contextHelper = useCallback(() => {
    return createInteractablesContextHelper(() => interactableComponents)();
  }, [interactableComponents]);

  // Register the default interactables context helper
  useEffect(() => {
    addContextHelper("interactables", contextHelper);

    return () => {
      removeContextHelper("interactables");
    };
  }, [contextHelper, addContextHelper, removeContextHelper]);

  useEffect(() => {
    if (interactableComponents.length > 0) {
      registerTool({
        name: "get_all_interactable_components",
        description:
          "Only use this tool if the user is asking about interactable components.Get all currently interactable components with their details including their current props. These are components that you can interact with on behalf of the user.",
        tool: () => {
          return {
            components: interactableComponents,
          };
        },
        toolSchema: z.function().returns(
          z.object({
            components: z.array(
              z.object({
                id: z.string(),
                componentName: z.string(),
                props: z.record(z.any()),
                propsSchema: z.object({}).optional(),
              }),
            ),
          }),
        ),
      });

      registerTool({
        name: "get_interactable_component_by_id",
        description: "Get a specific interactable component by its ID",
        tool: (componentId: string) => {
          const component = interactableComponents.find(
            (c) => c.id === componentId,
          );

          if (!component) {
            return {
              success: false,
              error: `Component with ID ${componentId} not found`,
            };
          }

          return {
            success: true,
            component: {
              id: component.id,
              componentName: component.name,
              props: component.props,
            },
          };
        },
        toolSchema: z
          .function()
          .args(z.string())
          .returns(
            z.object({
              success: z.boolean(),
              component: z
                .object({
                  id: z.string(),
                  componentName: z.string(),
                  props: z.record(z.any()),
                })
                .optional(),
              error: z.string().optional(),
            }),
          ),
      });

      registerTool({
        name: "remove_interactable_component",
        description: "Remove an interactable component from the system",
        tool: (componentId: string) => {
          const component = interactableComponents.find(
            (c) => c.id === componentId,
          );

          if (!component) {
            return {
              success: false,
              error: `Component with ID ${componentId} not found`,
            };
          }

          setInteractableComponents((prev) =>
            prev.filter((c) => c.id !== componentId),
          );

          return {
            success: true,
            componentId,
            removedComponent: {
              id: component.id,
              componentName: component.name,
              props: component.props,
            },
          };
        },
        toolSchema: z
          .function()
          .args(z.string())
          .returns(
            z.object({
              success: z.boolean(),
              componentId: z.string(),
              removedComponent: z.object({
                id: z.string(),
                componentName: z.string(),
                props: z.record(z.any()),
              }),
              error: z.string().optional(),
            }),
          ),
      });
    }
  }, [interactableComponents, registerTool]);

  const updateInteractableComponentProps = useCallback(
    (id: string, newProps: Record<string, any>): string => {
      if (!newProps || Object.keys(newProps).length === 0) {
        return `Warning: No props provided for component with ID ${id}.`;
      }

      setInteractableComponents((prev) => {
        const component = prev.find((c) => c.id === id);
        if (!component) {
          return prev;
        }

        // Compare props shallowly
        const propsChanged = Object.entries(newProps).some(([key, value]) => {
          return component.props[key] !== value;
        });

        if (!propsChanged) {
          return prev; // unchanged
        }

        // Apply partial update
        const updated = {
          ...component,
          props: { ...component.props, ...newProps },
        };

        const updatedComponents = [...prev];
        const idx = prev.findIndex((c) => c.id === id);
        updatedComponents[idx] = updated;

        return updatedComponents;
      });

      return "Updated successfully";
    },
    [],
  );

  const registerInteractableComponentUpdateTool = useCallback(
    (component: TamboInteractableComponent, maxNameLength = 60) => {
      const tamboToolNamePart = `update_component_`;
      const availableLength = maxNameLength - tamboToolNamePart.length;
      if (component.id.length > availableLength) {
        throw new Error(
          `Interactable component id ${component.id} is too long. It must be less than ${availableLength} characters.`,
        );
      }

      const schemaForArgs =
        typeof component.propsSchema === "object" &&
        "describe" in component.propsSchema &&
        "partial" in component.propsSchema
          ? (component.propsSchema as any).partial()
          : z.object({});

      registerTool({
        name: `${tamboToolNamePart}${component.id}`,
        description: `Update the props of interactable component ${component.id} (${component.name}). You can provide partial props (only the props you want to change) or complete props (all props). Only the props you specify will be updated.`,
        tool: (componentId: string, newProps: any) => {
          return updateInteractableComponentProps(componentId, newProps);
        },
        toolSchema: z
          .function()
          .args(
            z
              .string()
              .describe("The ID of the interactable component to update"),
            schemaForArgs.describe(
              "The props to update the component with. You can provide partial props (only the props you want to change) or complete props (all props). Only the props you specify will be updated.",
            ),
          )
          .returns(z.string()),
      });
    },
    [registerTool, updateInteractableComponentProps],
  );

  const addInteractableComponent = useCallback(
    (
      component: Omit<TamboInteractableComponent, "id" | "createdAt">,
    ): string => {
      // Validate component name
      assertValidName(component.name, "component");

      // Add a count part to the component name to make it unique when using multiple instances of the same component.
      const count = interactableComponents.filter(
        (c) => c.name === component.name,
      ).length;
      const tamboGeneratedNamePart = `-${count}`;
      const id = `${component.name}${tamboGeneratedNamePart}`;
      const newComponent: TamboInteractableComponent = {
        ...component,
        id,
      };

      registerInteractableComponentUpdateTool(newComponent);

      setInteractableComponents((prev) => {
        return [...prev, newComponent];
      });

      return id;
    },
    [registerInteractableComponentUpdateTool, interactableComponents],
  );

  const removeInteractableComponent = useCallback((id: string) => {
    setInteractableComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getInteractableComponent = useCallback(
    (id: string) => {
      return interactableComponents.find((c) => c.id === id);
    },
    [interactableComponents],
  );

  const getInteractableComponentsByName = useCallback(
    (componentName: string) => {
      return interactableComponents.filter((c) => c.name === componentName);
    },
    [interactableComponents],
  );

  const clearAllInteractableComponents = useCallback(() => {
    setInteractableComponents([]);
  }, []);

  const value: TamboInteractableContext = {
    interactableComponents,
    addInteractableComponent,
    removeInteractableComponent,
    updateInteractableComponentProps,
    getInteractableComponent,
    getInteractableComponentsByName,
    clearAllInteractableComponents,
  };

  return (
    <TamboInteractableContext.Provider value={value}>
      {children}
    </TamboInteractableContext.Provider>
  );
};

/**
 * The useTamboInteractable hook provides access to the interactable component
 * management functions.
 * @returns The interactable component management functions
 */
export const useTamboInteractable = () => {
  return useContext(TamboInteractableContext);
};

/**
 * Hook to get a cloned snapshot of the current interactables.
 * Returns a shallow copy of the array with cloned items and props to prevent
 * external mutation from affecting internal state.
 * @returns The current interactables snapshot (cloned).
 */
export const useCurrentInteractablesSnapshot = () => {
  const { interactableComponents } = useTamboInteractable();
  // Clone the array and each item/props to prevent mutation
  const copy = interactableComponents.map((c) => ({
    ...c,
    props: { ...c.props },
  }));

  return copy;
};
