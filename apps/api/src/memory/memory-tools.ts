import type { MemoryImportance } from "@tambo-ai-cloud/core";
import { MEMORY_CATEGORIES } from "@tambo-ai-cloud/core";
import { operations } from "@tambo-ai-cloud/db";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import type OpenAI from "openai";

export const SAVE_MEMORY_TOOL_NAME = "save_memory";
export const DELETE_MEMORY_TOOL_NAME = "delete_memory";

/**
 * Tool definitions for agent-visible memory tools.
 * Appended to strictTools by the API layer when memoryToolsEnabled is true.
 */
export const memoryToolDefinitions: OpenAI.Chat.Completions.ChatCompletionTool[] =
  [
    {
      type: "function",
      function: {
        name: SAVE_MEMORY_TOOL_NAME,
        description:
          "Save a fact or preference about the user for future conversations. Use when the user explicitly asks you to remember something, or when you learn an important fact worth preserving.",
        strict: true,
        parameters: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The fact to remember, in third person",
            },
            category: {
              type: "string",
              enum: [...MEMORY_CATEGORIES],
              description: "The category of the memory",
            },
            importance: {
              type: "integer",
              description:
                "1-5 scale: 5=core identity/preference, 3=useful context, 1=minor detail",
            },
          },
          required: ["content", "category"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: DELETE_MEMORY_TOOL_NAME,
        description:
          "Delete a previously saved memory. Use when the user asks you to forget something.",
        strict: true,
        parameters: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description:
                "The ID of the memory to delete (from the injected memories list)",
            },
          },
          required: ["memory_id"],
          additionalProperties: false,
        },
      },
    },
  ];

/**
 * Check if a tool name is a memory tool.
 */
export function isMemoryToolCall(toolName: string): boolean {
  return (
    toolName === SAVE_MEMORY_TOOL_NAME || toolName === DELETE_MEMORY_TOOL_NAME
  );
}

/**
 * Execute a memory tool call. Returns the tool result string.
 */
export async function executeMemoryToolCall(
  db: HydraDatabase,
  toolName: string,
  args: Record<string, unknown>,
  projectId: string,
  contextKey: string,
): Promise<string> {
  if (toolName === SAVE_MEMORY_TOOL_NAME) {
    const content = args.content as string;
    const category = args.category as string;
    const importance = (args.importance as number | undefined) ?? 3;

    const memory = await operations.createMemory(db, {
      projectId,
      contextKey,
      content,
      category: category as "preference" | "fact" | "goal" | "relationship",
      importance: importance as MemoryImportance,
    });

    return JSON.stringify({
      success: true,
      memoryId: memory.id,
      message: `Memory saved: "${content}"`,
    });
  }

  if (toolName === DELETE_MEMORY_TOOL_NAME) {
    const memoryId = args.memory_id as string;
    const deleted = await operations.softDeleteMemory(db, projectId, memoryId);

    if (!deleted) {
      return JSON.stringify({
        success: false,
        message: `Memory ${memoryId} not found or already deleted`,
      });
    }

    return JSON.stringify({
      success: true,
      message: `Memory ${memoryId} deleted`,
    });
  }

  throw new Error(`Unknown memory tool: ${toolName}`);
}
