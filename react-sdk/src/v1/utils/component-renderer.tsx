"use client";

/**
 * Component Renderer Utility
 *
 * Provides the component content context for rendered components.
 * Components can use useComponentContent() to access their context.
 */

import React, { createContext, useContext, useMemo } from "react";

/**
 * Context for component content blocks.
 * Provides access to the component ID and thread ID for component state hooks.
 */
export interface ComponentContentContext {
  /** Component instance ID */
  componentId: string;
  /** Thread ID the component belongs to */
  threadId: string;
  /** Message ID the component belongs to */
  messageId: string;
  /** Component name */
  componentName: string;
}

const ComponentContentContext = createContext<ComponentContentContext | null>(
  null,
);

/**
 * Provider for component content context.
 * Wraps rendered components to provide access to component metadata.
 * @returns Provider component with memoized context value
 */
export function ComponentContentProvider({
  children,
  componentId,
  threadId,
  messageId,
  componentName,
}: ComponentContentContext & { children: React.ReactNode }) {
  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(
    () => ({ componentId, threadId, messageId, componentName }),
    [componentId, threadId, messageId, componentName],
  );

  return (
    <ComponentContentContext.Provider value={value}>
      {children}
    </ComponentContentContext.Provider>
  );
}

/**
 * Hook to access the current component content context.
 * Must be used within a rendered component.
 * @returns Component content context
 * @throws {Error} If used outside a rendered component
 */
export function useComponentContent(): ComponentContentContext {
  const context = useContext(ComponentContentContext);
  if (!context) {
    throw new Error(
      "useComponentContent must be used within a rendered component",
    );
  }
  return context;
}

/**
 * Hook to optionally access the current component content context.
 * Returns null when used outside a rendered component instead of throwing.
 * @returns Component content context or null if not within a rendered component
 */
export function useComponentContentOptional(): ComponentContentContext | null {
  return useContext(ComponentContentContext);
}
