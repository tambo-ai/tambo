// react-sdk/src/providers/tambo-interactable-provider.tsx
"use client";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";
import TamboInteractableContext, {
  InteractableComponent,
} from "../model/tambo-interactable";

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
 * interactable, along with their props and metadata.
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

  const addInteractableComponent = useCallback(
    (component: Omit<InteractableComponent, "id" | "createdAt">): string => {
      const id = `${component.componentName}-${component.messageId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newComponent: InteractableComponent = {
        ...component,
        id,
        createdAt: new Date(),
      };

      setInteractableComponents((prev) => {
        // Remove any existing component with the same ID (shouldn't happen, but safety)
        const filtered = prev.filter((c) => c.id !== id);
        return [...filtered, newComponent];
      });

      return id;
    },
    [],
  );

  const removeInteractableComponent = useCallback((id: string) => {
    setInteractableComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

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
      return interactableComponents.filter(
        (c) => c.componentName === componentName,
      );
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
