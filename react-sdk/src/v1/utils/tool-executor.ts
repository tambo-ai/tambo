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
import type { ToolCallTracker } from "./tool-call-tracker";
import { createKeyedDebounce, type KeyedDebounce } from "./keyed-debounce";

/**
 * Pending tool call from the stream accumulator
 */
export interface PendingToolCall {
  name: string;
  input: Record<string, unknown>;
}

/**
 * Execute a streamable tool call during streaming with pre-parsed partial args.
 *
 * Called on each TOOL_CALL_ARGS event for tools annotated with
 * `tamboStreamableHint: true`. Enables incremental UI updates while
 * the model is still generating arguments.
 *
 * Errors are caught silently — streaming tool execution is non-fatal since
 * the final execution via `awaiting_input` is what matters.
 * @param toolCallId - The tool call ID being accumulated
 * @param parsedArgs - Pre-parsed partial JSON args
 * @param toolTracker - Tracker holding pending tool call state
 * @param toolRegistry - Record of tool name to tool definition
 */
export async function executeStreamableToolCall(
  toolCallId: string,
  parsedArgs: Record<string, unknown>,
  toolTracker: ToolCallTracker,
  toolRegistry: Record<string, TamboTool>,
): Promise<void> {
  const accumulating = toolTracker.getAccumulatingToolCall(toolCallId);
  if (!accumulating) return;

  const tool = toolRegistry[accumulating.name];
  if (!tool?.annotations?.tamboStreamableHint) return;

  try {
    await tool.tool(parsedArgs);
  } catch {
    // Tool execution error during streaming is non-fatal
  }
}

const DEFAULT_STREAMABLE_DEBOUNCE_MS = 150;

/**
 * Creates a debounced wrapper around executeStreamableToolCall.
 *
 * Each tool call ID gets its own independent debounce timer via
 * {@link createKeyedDebounce}. When a new call arrives for the same ID,
 * the previous timer is cancelled and the args are replaced. After
 * `delay` ms of quiet, the tool executes with the latest args.
 * Call `flush()` to force-execute all pending calls.
 * @param toolTracker - Tracker holding pending tool call state
 * @param toolRegistry - Record of tool name to tool definition
 * @param delay - Debounce delay in milliseconds
 * @returns Keyed debounce controller (schedule / flush)
 */
export function createDebouncedStreamableExecutor(
  toolTracker: ToolCallTracker,
  toolRegistry: Record<string, TamboTool>,
  delay = DEFAULT_STREAMABLE_DEBOUNCE_MS,
): KeyedDebounce<Record<string, unknown>> {
  return createKeyedDebounce<Record<string, unknown>>((toolCallId, args) => {
    void executeStreamableToolCall(toolCallId, args, toolTracker, toolRegistry);
  }, delay);
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
      isError: true,
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
        isError: true,
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
