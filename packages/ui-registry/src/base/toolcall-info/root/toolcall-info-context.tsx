import type { TamboThreadMessage } from "@tambo-ai/react";
import type TamboAI from "@tambo-ai/typescript-sdk";
import * as React from "react";

export interface ToolcallInfoContextValue {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  toolCallRequest: TamboAI.ToolCallRequest | undefined;
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
