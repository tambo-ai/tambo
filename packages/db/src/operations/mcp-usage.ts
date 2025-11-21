import { mcpUsage } from "../schema";
import type { HydraDb } from "../types";

export async function logMcpUsage(
  db: HydraDb,
  data: {
    transport?: string | null;
    toolName?: string | null;
    query?: string | null;
    response?: string | null;
    metadata?: Record<string, unknown> | null;
  },
) {
  await db.insert(mcpUsage).values({
    transport: data.transport ?? null,
    toolName: data.toolName ?? null,
    query: data.query ?? null,
    response: data.response ?? null,
    metadata: data.metadata ?? null,
  });
}
