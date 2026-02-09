import type { api, useTRPCClient } from "@/trpc/react";

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
import type { UseTamboReturn } from "@tambo-ai/react";
export type RegisterToolFn = UseTamboReturn["registerTool"];
