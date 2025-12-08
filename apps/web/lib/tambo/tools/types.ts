import type { api, useTRPCClient } from "@/trpc/react";

/**
 * Tool context containing TRPC client and utilities
 */
export interface ToolContext {
  trpcClient: ReturnType<typeof useTRPCClient>;
  utils: ReturnType<typeof api.useUtils>;
}

/**
 * Tool registration function.
 * Uses a permissive signature to be compatible with the SDK's RegisterToolFn
 * without importing the complex generic types that cause type explosion.
 */
export type RegisterToolFn = (tool: any) => void;
