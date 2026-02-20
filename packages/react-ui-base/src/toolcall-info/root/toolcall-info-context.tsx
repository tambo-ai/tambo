import type { TamboThreadMessage, TamboToolUseContent } from "@tambo-ai/react";
import * as React from "react";

export interface ToolcallInfoContextValue {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  toolCallRequest: TamboToolUseContent | undefined;
  hasToolError: boolean;
  toolStatusMessage: string;
  associatedToolResponse: TamboThreadMessage | null;
  detailsId: string;
  isLoading: boolean | undefined;
  message: TamboThreadMessage;
}

export const ToolcallInfoContext =
  React.createContext<ToolcallInfoContextValue | null>(null);

/**
 * Hook to access the toolcall info context.
 * @internal This hook is for internal use by base components only.
 * Consumers should use component `render` props instead.
 * @returns The toolcall info context value
 * @throws Error if used outside of ToolcallInfo.Root
 */
export function useToolcallInfoContext(): ToolcallInfoContextValue {
  const context = React.useContext(ToolcallInfoContext);
  if (!context) {
    throw new Error(
      "React UI Base: ToolcallInfoContext is missing. ToolcallInfo parts must be used within <ToolcallInfo.Root>",
    );
  }
  return context;
}
