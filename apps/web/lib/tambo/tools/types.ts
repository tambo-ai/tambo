import type { api, useTRPCClient } from "@/trpc/react";
import { type TamboTool } from "@tambo-ai/react";

/**
 * Tool context containing TRPC client and utilities
 */
export interface ToolContext {
  trpcClient: ReturnType<typeof useTRPCClient>;
  utils: ReturnType<typeof api.useUtils>;
}

/**
 * Tool registration function
 */
export type RegisterToolFn = (tool: TamboTool) => void;
