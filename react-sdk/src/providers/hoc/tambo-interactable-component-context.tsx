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
 * Hook to access the current interactable component context.
 *
 * **IMPORTANT**: This hook ONLY works when used inside a component that has been
 * wrapped with `withInteractable`. It will return `null` if used outside
 * of an interactable component tree.
 * @returns The interactable component metadata (id, name, description) or null if used outside of an interactable component
 * @example
 * ```tsx
 * // This component must be rendered INSIDE an interactable component
 * function MyInlineEditor() {
 *   const component = useTamboInteractableComponent();
 *
 *   // Always check for null - will be null if not inside an interactable
 *   if (!component) return null;
 *
 *   return <div>Editing {component.name}: {component.description}</div>;
 * }
 *
 * // Usage inside an interactable component:
 * const InteractableNote = withInteractable(Note, { ... });
 *
 * function Note({ title, content }) {
 *   return (
 *     <div>
 *       <h3>{title}</h3>
 *       <p>{content}</p>
 *       <MyInlineEditor /> // ✓ Works here - inside interactable
 *     </div>
 *   );
 * }
 *
 * // This will NOT work:
 * function App() {
 *   return (
 *     <div>
 *       <MyInlineEditor /> // ✗ Returns null - not inside interactable
 *       <InteractableNote title="..." content="..." />
 *     </div>
 *   );
 * }
 * ```
 */
export function useTamboInteractableComponent(): TamboInteractableComponent | null {
  return useContext(TamboInteractableComponentContext);
}
