"use client";
import React, { createContext, useContext } from "react";

export interface TamboInteractableComponentMeta {
  id: string;
  name: string;
  description: string;
}

const TamboInteractableComponentMetaContext =
  createContext<TamboInteractableComponentMeta | null>(null);

export interface TamboInteractableComponentMetaProviderProps {
  children: React.ReactNode;
  meta: TamboInteractableComponentMeta;
}

/**
 * Provider that exposes interactable component metadata to nested components.
 * Used internally by withTamboInteractable to make metadata available to
 * inline editors and other child components.
 * @param props - The props for the TamboInteractableComponentMetaProvider
 * @param props.children - The children to wrap
 * @param props.meta - The metadata for the interactable component
 * @example
 * ```tsx
 * <TamboInteractableComponentMetaProvider meta={{ id: "123", name: "MyComponent", description: "My component description" }}>
 *   <MyComponent />
 * </TamboInteractableComponentMetaProvider>
 * ```
 * @returns The TamboInteractableComponentMetaProvider component
 */
export function TamboInteractableComponentMetaProvider({
  children,
  meta,
}: TamboInteractableComponentMetaProviderProps) {
  return (
    <TamboInteractableComponentMetaContext.Provider value={meta}>
      {children}
    </TamboInteractableComponentMetaContext.Provider>
  );
}

/**
 * Hook to access the current interactable component's metadata.
 * Returns null if used outside of an interactable component.
 * @returns The interactable component metadata (id, name, description) or null
 * @example
 * ```tsx
 * function MyInlineEditor() {
 *   const meta = useTamboInteractableComponentMeta();
 *   if (!meta) return null;
 *
 *   return <div>Editing {meta.name}: {meta.description}</div>;
 * }
 * ```
 */
export function useTamboInteractableComponentMeta(): TamboInteractableComponentMeta | null {
  return useContext(TamboInteractableComponentMetaContext);
}
