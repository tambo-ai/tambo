/**
 * Run execution with streaming and automatic tool call loop
 */

import type { TamboClient } from "./client.js";
import type { ToolRegistry } from "./tools.js";
import type {
  RunRunParams,
  RunRunResponse,
  TextContent,
  ToolResult,
  ToolResultContent,
} from "./types.js";

export interface RunOptions {
  /** Tool registry for handling tool calls */
  tools?: ToolRegistry;
  /** Callback for each streaming event */
  onEvent?: (event: RunRunResponse) => void;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Max tool call rounds before throwing (defaults to 10) */
  maxToolRounds?: number;
  /**
   * Called after each tool round completes. Return false to abort execution.
   * Useful for implementing soft limits with user prompts.
   */
  onRoundComplete?: (round: number) => Promise<boolean>;
}

interface PendingToolCall {
  id: string;
  name: string;
  argsBuffer: string;
}

/**
 * Runtime shape of streaming events from the API.
 *
 * The SDK types RunRunResponse as { type: string; timestamp?: number },
 * but the actual SSE payloads include additional fields per event type.
 * We define this locally to safely access those fields after casting.
 */
interface StreamEventData {
  type: string;
  timestamp?: number;
  runId?: string;
  delta?: string;
  toolCallId?: string;
  toolCallName?: string;
}

/**
 * Execute a run on a thread with automatic tool call handling
 *
 * Streams the response, executes any tool calls via the registry,
 * sends results back, and continues until the model finishes.
 *
 * @param client - TamboClient instance
 * @param threadId - Thread to run on
 * @param message - User message content
 * @param options - Run options including tools and callbacks
 * @returns Promise resolving to collected text content from the final response
 */
export async function executeRun(
  client: TamboClient,
  threadId: string,
  message: string,
  options?: RunOptions,
): Promise<string> {
  const maxToolRounds = options?.maxToolRounds ?? 10;
  let previousRunId: string | undefined;
  let round = 0;

  // Initial message
  let runParams: RunRunParams = buildRunParams(
    message,
    options?.tools,
    previousRunId,
  );

  while (round <= maxToolRounds) {
    const stream = await client.sdk.threads.runs.run(threadId, {
      ...runParams,
      ...(client.userKey ? { userKey: client.userKey } : {}),
    });

    const pendingToolCalls = new Map<string, PendingToolCall>();
    let collectedText = "";
    let currentRunId: string | undefined;

    for await (const event of stream) {
      options?.onEvent?.(event);

      // SDK types RunRunResponse as { type; timestamp? } but runtime events
      // carry additional fields. Cast through unknown to access them safely.
      const data = event as unknown as StreamEventData;

      switch (data.type) {
        case "RUN_STARTED":
          currentRunId = data.runId;
          break;

        case "TEXT_MESSAGE_CONTENT":
          collectedText += data.delta ?? "";
          break;

        case "TOOL_CALL_START": {
          const toolCallId = data.toolCallId!;
          pendingToolCalls.set(toolCallId, {
            id: toolCallId,
            name: data.toolCallName!,
            argsBuffer: "",
          });
          break;
        }

        case "TOOL_CALL_ARGS": {
          const pending = pendingToolCalls.get(data.toolCallId!);
          if (pending) {
            pending.argsBuffer += data.delta ?? "";
          }
          break;
        }

        case "TOOL_CALL_END":
        case "RUN_FINISHED":
        case "RUN_ERROR":
          break;
      }
    }

    // If no tool calls, we're done
    if (pendingToolCalls.size === 0) {
      return collectedText;
    }

    // Execute all pending tool calls
    if (!options?.tools) {
      throw new Error(
        "Model requested tool calls but no tool registry was provided",
      );
    }

    const toolResults: ToolResult[] = await Promise.all(
      [...pendingToolCalls.values()].map(
        async (tc) =>
          await options.tools!.execute(tc.name, tc.id, tc.argsBuffer),
      ),
    );

    // Send tool results back as next round
    previousRunId = currentRunId;
    round++;

    // Allow caller to abort after a round (e.g. soft limit prompt)
    if (options?.onRoundComplete) {
      const shouldContinue = await options.onRoundComplete(round);
      if (!shouldContinue) {
        throw new Error("Execution aborted by onRoundComplete callback");
      }
    }

    if (round > maxToolRounds) {
      throw new Error(
        `Exceeded maximum tool rounds (${maxToolRounds}). Possible infinite loop.`,
      );
    }

    const toolResultContent: ToolResultContent[] = toolResults.map((r) => ({
      type: "tool_result" as const,
      toolUseId: r.toolUseId,
      content: r.content as Array<TextContent>,
      ...(r.isError ? { isError: true } : {}),
    }));

    runParams = {
      message: {
        role: "user" as const,
        content: toolResultContent,
      },
      tools: options.tools.toApiFormat(),
      previousRunId,
    };
  }

  throw new Error(
    `Exceeded maximum tool rounds (${maxToolRounds}). Possible infinite loop.`,
  );
}

function buildRunParams(
  message: string,
  tools?: ToolRegistry,
  previousRunId?: string,
): RunRunParams {
  return {
    message: {
      role: "user" as const,
      content: [{ type: "text" as const, text: message }],
    },
    ...(tools ? { tools: tools.toApiFormat() } : {}),
    ...(previousRunId ? { previousRunId } : {}),
  };
}
