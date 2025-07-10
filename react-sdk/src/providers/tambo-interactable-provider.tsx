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
  InteractableComponent,
  type TamboInteractableContext,
} from "../model/tambo-interactable";
import { useTamboComponent } from "./tambo-component-provider";

const TamboInteractableContext = createContext<TamboInteractableContext>({
  interactableComponents: [],
  addInteractableComponent: () => "",
  removeInteractableComponent: () => {},
  updateInteractableComponentProps: () => {},
  updateInteractableComponentMetadata: () => {},
  setInteractableComponentState: () => {},
  getInteractableComponent: () => undefined,
  getInteractableComponentsByName: () => [],
  getInteractableComponentsByThread: () => [],
  clearAllInteractableComponents: () => {},
  clearInteractableComponentsByThread: () => {},
  markComponentInteracted: () => {},
});

/**
 * The TamboInteractableProvider manages a list of components that are currently
 * interactable, along with their props and metadata. It also registers tools
 * for Tambo to perform CRUD operations on the components.
 * @param props - The props for the TamboInteractableProvider
 * @param props.children - The children to wrap
 * @returns The TamboInteractableProvider component
 */
export const TamboInteractableProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [interactableComponents, setInteractableComponents] = useState<
    InteractableComponent[]
  >([]);
  const { registerTool } = useTamboComponent();

  useEffect(() => {
    registerTool({
      name: "get_all_interactable_components",
      description:
        "Get all currently interactable components with their details including their current props structure",
      tool: () => {
        return {
          components: interactableComponents.map((component) => ({
            id: component.id,
            componentName: component.name,
            props: component.props,
            messageId: component.messageId,
            threadId: component.threadId,
            isInteractable: component.isInteractable,
            createdAt: component.createdAt.toISOString(),
            lastInteraction: component.lastInteraction?.toISOString(),
            metadata: component.metadata,
          })),
          totalCount: interactableComponents.length,
        };
      },
      toolSchema: z.function().returns(
        z.object({
          components: z.array(
            z.object({
              id: z.string(),
              componentName: z.string(),
              props: z.record(z.any()),
              messageId: z.string(),
              threadId: z.string(),
              isInteractable: z.boolean(),
              createdAt: z.string(),
              lastInteraction: z.string().optional(),
              metadata: z.record(z.any()).optional(),
            }),
          ),
          totalCount: z.number(),
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
            messageId: component.messageId,
            threadId: component.threadId,
            isInteractable: component.isInteractable,
            createdAt: component.createdAt.toISOString(),
            lastInteraction: component.lastInteraction?.toISOString(),
            metadata: component.metadata,
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
                messageId: z.string(),
                threadId: z.string(),
                isInteractable: z.boolean(),
                createdAt: z.string(),
                lastInteraction: z.string().optional(),
                metadata: z.record(z.any()).optional(),
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
            messageId: component.messageId,
            threadId: component.threadId,
            isInteractable: component.isInteractable,
            createdAt: component.createdAt.toISOString(),
            metadata: component.metadata,
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
              messageId: z.string(),
              threadId: z.string(),
              isInteractable: z.boolean(),
              createdAt: z.string(),
              metadata: z.record(z.any()).optional(),
            }),
            error: z.string().optional(),
          }),
        ),
    });
  }, [interactableComponents, registerTool]);

  const updateInteractableComponentProps = useCallback(
    (id: string, newProps: Record<string, any>) => {
      setInteractableComponents((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c,
        ),
      );
    },
    [],
  );

  const registerInteractableComponentUpdateTool = useCallback(
    (component: InteractableComponent) => {
      // Handle both Zod schema and JSONSchema7 types
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
    (component: Omit<InteractableComponent, "id" | "createdAt">): string => {
      const id = `${component.name}-${Math.random().toString(36).substr(2, 9)}`;
      const newComponent: InteractableComponent = {
        ...component,
        id,
        createdAt: new Date(),
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

  const updateInteractableComponentMetadata = useCallback(
    (id: string, metadata: Record<string, any>) => {
      setInteractableComponents((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, metadata: { ...c.metadata, ...metadata } } : c,
        ),
      );
    },
    [],
  );

  const setInteractableComponentState = useCallback(
    (id: string, isInteractable: boolean) => {
      setInteractableComponents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isInteractable } : c)),
      );
    },
    [],
  );

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

  const getInteractableComponentsByThread = useCallback(
    (threadId: string) => {
      return interactableComponents.filter((c) => c.threadId === threadId);
    },
    [interactableComponents],
  );

  const clearAllInteractableComponents = useCallback(() => {
    setInteractableComponents([]);
  }, []);

  const clearInteractableComponentsByThread = useCallback(
    (threadId: string) => {
      setInteractableComponents((prev) =>
        prev.filter((c) => c.threadId !== threadId),
      );
    },
    [],
  );

  const markComponentInteracted = useCallback((id: string) => {
    setInteractableComponents((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, lastInteraction: new Date() } : c,
      ),
    );
  }, []);

  const value: TamboInteractableContext = {
    interactableComponents,
    addInteractableComponent,
    removeInteractableComponent,
    updateInteractableComponentProps,
    updateInteractableComponentMetadata,
    setInteractableComponentState,
    getInteractableComponent,
    getInteractableComponentsByName,
    getInteractableComponentsByThread,
    clearAllInteractableComponents,
    clearInteractableComponentsByThread,
    markComponentInteracted,
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
