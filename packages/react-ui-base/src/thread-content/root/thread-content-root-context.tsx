import { TamboThreadMessage } from "@tambo-ai/react";
import React from "react";

/**
 * Context value shared among ThreadContent primitive sub-components.
 */
export interface ThreadContentRootContextValue {
  /** Array of message objects in the thread. */
  messages: TamboThreadMessage[];
  /** Whether a response is currently being generated. */
  isGenerating: boolean;
  /** Current generation stage identifier. */
  generationStage?: string;
}

const ThreadContentRootContext =
  React.createContext<ThreadContentRootContextValue | null>(null);

/**
 * Hook to optionally access the thread content context.
 * Returns null if not within a ThreadContent.Root component.
 * @internal This hook is for internal use by base components only.
 * @returns The thread content context value or null
 */
function useOptionalThreadContentRootContext(): ThreadContentRootContextValue | null {
  return React.useContext(ThreadContentRootContext);
}

/**
 * Hook to access the thread content context.
 * @internal This hook is for internal use by base components only.
 * @returns The thread content context value
 * @throws Error if used outside of ThreadContent.Root component
 */
function useThreadContentRootContext(): ThreadContentRootContextValue {
  const context = React.useContext(ThreadContentRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: ThreadContentRootContext is missing. ThreadContent parts must be used within <ThreadContent.Root>",
    );
  }
  return context;
}

export {
  ThreadContentRootContext,
  useOptionalThreadContentRootContext,
  useThreadContentRootContext,
};
