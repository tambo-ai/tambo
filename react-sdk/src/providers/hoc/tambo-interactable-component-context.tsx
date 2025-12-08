"use client";
import React, { createContext, useContext } from "react";

export interface TamboInteractableComponent {
  id: string;
  name: string;
  description: string;
}

const TamboInteractableComponentContext =
  createContext<TamboInteractableComponent | null>(null);

export interface TamboInteractableComponentProviderProps {
  children: React.ReactNode;
  component: TamboInteractableComponent;
}

/**
 * Provider that exposes interactable component to nested components.
 * Used internally by withTamboInteractable to make component available to
 * inline editors and other child components.
 * @param props - The props for the TamboInteractableComponentProvider
 * @param props.children - The children to wrap
 * @param props.component - The interactable component
 * @example
 * ```tsx
 * <TamboInteractableComponentProvider component={{ id: "123", name: "MyComponent", description: "My component description" }}>
 *   <MyComponent />
 * </TamboInteractableComponentProvider>
 * ```
 * @returns The TamboInteractableComponentProvider
 */
export function TamboInteractableComponentProvider({
  children,
  component,
}: TamboInteractableComponentProviderProps) {
  return (
    <TamboInteractableComponentContext.Provider value={component}>
      {children}
    </TamboInteractableComponentContext.Provider>
  );
}

/**
 * Hook to access the current interactable component.
 * Returns null if used outside of an interactable component.
 * @returns The interactable component (id, name, description) or null
 * @example
 * ```tsx
 * function MyInlineEditor() {
 *   const component = useTamboInteractableComponent();
 *   if (!component) return null;
 *
 *   return <div>Editing {component.name}: {component.description}</div>;
 * }
 * ```
 */
export function useTamboInteractableComponent(): TamboInteractableComponent | null {
  return useContext(TamboInteractableComponentContext);
}
