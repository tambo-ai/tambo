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
import {
  TamboInteractableComponent,
  type TamboInteractableContext,
} from "../model/tambo-interactable";
import { useTamboComponent } from "./tambo-component-provider";

const TamboInteractableContext = createContext<TamboInteractableContext>({
  interactableComponents: [],
  addInteractableComponent: () => "",
  removeInteractableComponent: () => {},
  updateInteractableComponentProps: () => {},
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

  useEffect(() => {
    registerTool({
      name: "get_all_interactable_components",
      description:
        "Get all currently interactable components with their details including their current props",
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
  }, [interactableComponents, registerTool]);

  const updateInteractableComponentProps = useCallback(
    (id: string, newProps: Record<string, any>) => {
      let updateResult = "Updated successfully";

      setInteractableComponents((prev) => {
        const componentExists = prev.some((c) => c.id === id);

        if (!componentExists) {
          updateResult = `Error: Component with ID ${id} not found`;
          return prev;
        }

        const updatedComponents = prev.map((c) =>
          c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c,
        );

        // Check if the update actually changed anything
        const originalComponent = prev.find((c) => c.id === id);
        const updatedComponent = updatedComponents.find((c) => c.id === id);

        if (!originalComponent || !updatedComponent) {
          updateResult = `Error: Failed to update component with ID ${id}`;
          return prev;
        }

        // Check if props actually changed
        const propsChanged =
          JSON.stringify(originalComponent.props) !==
          JSON.stringify(updatedComponent.props);

        if (!propsChanged) {
          updateResult = `Warning: No changes detected for component with ID ${id}. The update might not have worked.`;
          return prev;
        }

        return updatedComponents;
      });

      return updateResult;
    },
    [],
  );

  const registerInteractableComponentUpdateTool = useCallback(
    (component: TamboInteractableComponent) => {
      const schemaForArgs =
        typeof component.propsSchema === "object" &&
        "describe" in component.propsSchema
          ? component.propsSchema
          : z.object({});

      registerTool({
        name: `update_interactable_component_${component.id}`,
        description: `Update the props of interactable component ${component.id} (${component.name})`,
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
              "The new props to update the component with",
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
      const id = `${component.name}-${Math.random().toString(36).substr(2, 9)}`;
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
    [registerInteractableComponentUpdateTool],
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
