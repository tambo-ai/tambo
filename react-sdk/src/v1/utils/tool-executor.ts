/**
 * Tool Executor for v1 API
 *
 * Handles automatic execution of client-side tools when the model
 * requests them via `tambo.run.awaiting_input` events.
 */

import type { TamboTool } from "../../model/component-metadata";
import type {
  ToolResultContent,
  TextContent,
  ResourceContent,
} from "@tambo-ai/typescript-sdk/resources/threads/threads";

/**
 * Pending tool call from the stream accumulator
 */
export interface PendingToolCall {
  name: string;
  input: Record<string, unknown>;
}

/**
 * Execute a single client-side tool and return the result.
 * @param tool - The tool definition from the registry
 * @param toolCallId - The ID of the tool call to respond to
 * @param args - The parsed arguments for the tool
 * @returns ToolResultContent with the execution result or error
 */
export async function executeClientTool(
  tool: TamboTool,
  toolCallId: string,
  args: Record<string, unknown>,
): Promise<ToolResultContent> {
  try {
    const result = await tool.tool(args);

    // Transform result to content if transformer provided
    let content: (TextContent | ResourceContent)[];
    if (tool.transformToContent) {
      // transformToContent may return content parts in beta format
      // Convert to v1 format (TextContent | ResourceContent)
      const transformed = await tool.transformToContent(result);
      content = transformed.map((part) => {
        if (part.type === "text" && "text" in part && part.text) {
          return { type: "text" as const, text: part.text };
        }
        // For other types, stringify as text
        return {
          type: "text" as const,
          text: JSON.stringify(part),
        };
      });
    } else {
      // Default: stringify result as text
      content = [
        {
          type: "text" as const,
          text: typeof result === "string" ? result : JSON.stringify(result),
        },
      ];
    }

    return {
      type: "tool_result",
      toolUseId: toolCallId,
      content,
    };
  } catch (error) {
    return {
      type: "tool_result",
      toolUseId: toolCallId,
      content: [
        {
          type: "text" as const,
          text:
            error instanceof Error ? error.message : "Tool execution failed",
        },
      ],
    };
  }
}

/**
 * Execute all pending tool calls and return their results.
 * Tools are executed sequentially to avoid race conditions when
 * tools may have side effects that depend on each other.
 * @param toolCalls - Map of tool call IDs to their call details
 * @param registry - Registry of tool names to their definitions (Map or Record)
 * @returns Array of ToolResultContent for all executed tools
 */
export async function executeAllPendingTools(
  toolCalls: Map<string, PendingToolCall>,
  registry: Map<string, TamboTool> | Record<string, TamboTool>,
): Promise<ToolResultContent[]> {
  const results: ToolResultContent[] = [];

  // Normalize registry to allow lookup regardless of Map or Record
  const getTool = (name: string): TamboTool | undefined => {
    if (registry instanceof Map) {
      return registry.get(name);
    }
    return registry[name];
  };

  for (const [toolCallId, { name, input }] of toolCalls) {
    const tool = getTool(name);
    if (!tool) {
      results.push({
        type: "tool_result",
        toolUseId: toolCallId,
        content: [
          {
            type: "text" as const,
            text: `Tool "${name}" not found in registry`,
          },
        ],
      });
      continue;
    }

    const result = await executeClientTool(tool, toolCallId, input);
    results.push(result);
  }

  return results;
}
