import * as React from "react";

/**
 * Context value shared among CanvasSpace primitive sub-components.
 */
export interface CanvasSpaceRootContextValue {
  /** The currently rendered component, or null if the canvas is empty. */
  renderedComponent: React.ReactNode | null;
  /** Ref for the scrollable viewport container. */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const CanvasSpaceRootContext =
  React.createContext<CanvasSpaceRootContextValue | null>(null);

/**
 * Hook to access the canvas space context.
 * @internal This hook is for internal use by base components only.
 * @returns The canvas space context value
 * @throws Error if used outside of CanvasSpace.Root component
 */
function useCanvasSpaceRootContext(): CanvasSpaceRootContextValue {
  const context = React.useContext(CanvasSpaceRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: CanvasSpaceRootContext is missing. CanvasSpace parts must be used within <CanvasSpace.Root>",
    );
  }
  return context;
}

export { CanvasSpaceRootContext, useCanvasSpaceRootContext };
