"use client";

/**
 * Component Renderer Utility for v1 API
 *
 * Provides the component content context for rendered components.
 * Components can use useV1ComponentContent() to access their context.
 */

import React, { createContext, useContext, useMemo } from "react";

/**
 * Context for component content blocks.
 * Provides access to the component ID and thread ID for component state hooks.
 */
export interface V1ComponentContentContext {
  /** Component instance ID */
  componentId: string;
  /** Thread ID the component belongs to */
  threadId: string;
  /** Message ID the component belongs to */
  messageId: string;
  /** Component name */
  componentName: string;
}

const ComponentContentContext = createContext<V1ComponentContentContext | null>(
  null,
);

/**
 * Provider for component content context.
 * Wraps rendered components to provide access to component metadata.
 * @returns Provider component with memoized context value
 */
export function V1ComponentContentProvider({
  children,
  componentId,
  threadId,
  messageId,
  componentName,
}: V1ComponentContentContext & { children: React.ReactNode }) {
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
export function useV1ComponentContent(): V1ComponentContentContext {
  const context = useContext(ComponentContentContext);
  if (!context) {
    throw new Error(
      "useV1ComponentContent must be used within a rendered component",
    );
  }
  return context;
}
