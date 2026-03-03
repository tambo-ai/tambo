import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";

export interface ThreadContentContextValue {
  messages: TamboThreadMessage[];
  isGenerating: boolean;
  isEmpty: boolean;
  isLoading: boolean;
}

export const ThreadContentContext =
  React.createContext<ThreadContentContextValue | null>(null);

/**
 * Hook to access the thread content context.
 * @internal This hook is for internal use by base components only.
 * Consumers should use component `render` props instead.
 * @returns The thread content context value
 * @throws Error if used outside of ThreadContent.Root
 */
export function useThreadContentContext(): ThreadContentContextValue {
  const context = React.useContext(ThreadContentContext);
  if (!context) {
    throw new Error(
      "React UI Base: ThreadContentContext is missing. ThreadContent parts must be used within <ThreadContent.Root>",
    );
  }
  return context;
}
