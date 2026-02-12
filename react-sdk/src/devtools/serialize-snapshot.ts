/**
 * Snapshot serialization for the devtools bridge.
 *
 * Transforms raw SDK state (containing React elements, functions, Zod schemas,
 * and other non-serializable values) into a safe wire-transmissible format
 * matching DevToolsStateSnapshot.
 */

import type {
  ComponentRegistry,
  TamboToolRegistry,
} from "../model/component-metadata";
import type { NormalizedMcpServerInfo } from "../model/mcp-server-info";
import type { Content } from "../v1/types/message";
import type { StreamingState } from "../v1/types/thread";
import type { StreamState, ThreadState } from "../v1/utils/event-accumulator";
import type {
  DevToolsError,
  DevToolsStateSnapshot,
  SerializedContent,
  SerializedMessage,
  SerializedStreamingState,
} from "./devtools-protocol";

/**
 * Raw SDK state passed into the serializer.
 */
export interface RawDevtoolsState {
  streamState: StreamState;
  componentList: ComponentRegistry;
  toolRegistry: TamboToolRegistry;
  mcpServerInfos: NormalizedMcpServerInfo[];
}

/**
 * The shape returned by serializeForDevtools -- everything needed for a
 * DevToolsStateSnapshot except the envelope fields (type, sessionId, timestamp).
 */
type SerializedSnapshot = Omit<
  DevToolsStateSnapshot,
  "type" | "sessionId" | "timestamp"
>;

/**
 * Serialize raw SDK state into a devtools-safe snapshot payload.
 * Strips ReactElements, functions, Zod validators, and handles circular refs.
 * @param raw - The raw SDK state from React contexts
 * @returns Serialized snapshot payload ready for wire transmission
 */
export function serializeForDevtools(
  raw: RawDevtoolsState,
): SerializedSnapshot {
  const { streamState, componentList, toolRegistry, mcpServerInfos } = raw;

  const errors: DevToolsError[] = [];

  // Serialize threads
  const threads = Object.values(streamState.threadMap).map((threadState) =>
    serializeThread(threadState, errors),
  );

  // Serialize registry
  const components = Object.values(componentList).map((comp) => ({
    name: comp.name,
    description: comp.description,
    propsSchema: safeStringifySchema(comp.props),
  }));

  const tools = Object.values(toolRegistry).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: safeStringifySchema(tool.inputSchema),
    outputSchema: safeStringifySchema(tool.outputSchema),
  }));

  const mcpServers = mcpServerInfos.map((s) => ({
    name: s.name ?? s.url,
    url: s.url,
    status: "connected",
  }));

  return {
    threads,
    registry: {
      components,
      tools,
      ...(mcpServers.length > 0 ? { mcpServers } : {}),
    },
    ...(errors.length > 0 ? { errors } : {}),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function serializeThread(
  threadState: ThreadState,
  errors: DevToolsError[],
): SerializedSnapshot["threads"][number] {
  const { thread, streaming } = threadState;

  // Collect streaming errors
  if (streaming.error) {
    errors.push({
      type: "streaming",
      message: streaming.error.message,
      threadId: thread.id,
      timestamp: Date.now(),
    });
  }

  // Collect tool_result errors from messages
  for (const msg of thread.messages) {
    for (const block of msg.content) {
      if (block.type === "tool_result" && "isError" in block && block.isError) {
        const contentText =
          typeof block.content === "string"
            ? block.content
            : JSON.stringify(block.content);
        errors.push({
          type: "tool_call",
          message: contentText,
          threadId: thread.id,
          timestamp: Date.now(),
        });
      }
    }
  }

  const messages: SerializedMessage[] = thread.messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content.map(serializeContentBlock),
    ...(msg.createdAt ? { createdAt: msg.createdAt } : {}),
    ...(msg.metadata
      ? { metadata: deepCleanForJson(msg.metadata) as Record<string, unknown> }
      : {}),
  }));

  const streamingState: SerializedStreamingState = {
    status: streaming.status,
    ...(streaming.runId ? { runId: streaming.runId } : {}),
    ...(streaming.messageId ? { messageId: streaming.messageId } : {}),
    ...(streaming.error ? { error: streaming.error } : {}),
  };

  return {
    id: thread.id,
    name: thread.name,
    status: mapThreadStatus(streaming),
    messageCount: thread.messages.length,
    messages,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    streamingState,
  };
}

function mapThreadStatus(
  streaming: StreamingState,
): "idle" | "streaming" | "waiting" {
  return streaming.status;
}

function serializeContentBlock(block: Content): SerializedContent {
  switch (block.type) {
    case "text":
      return { type: "text", text: block.text };

    case "tool_use":
      return {
        type: "tool_use",
        id: block.id,
        name: block.name,
        input: deepCleanForJson(block.input) as Record<string, unknown>,
      };

    case "tool_result":
      return {
        type: "tool_result",
        toolUseId: block.toolUseId,
        content: deepCleanForJson(block.content),
        ...("isError" in block && block.isError ? { isError: true } : {}),
      };

    case "component":
      return {
        type: "component",
        name: block.name,
        props: deepCleanForJson(block.props) as Record<string, unknown>,
      };

    case "resource":
      return {
        type: "resource",
        uri: block.resource?.uri ?? "",
        content: deepCleanForJson(block.resource),
      };
  }
}

/**
 * Attempt to serialize a schema (which may be a Zod schema, Standard Schema,
 * or plain object) into a JSON-compatible object.
 * @param schema - The schema to serialize
 * @returns A JSON-safe representation, or undefined if not serializable
 */
function safeStringifySchema(
  schema: unknown,
): Record<string, unknown> | undefined {
  if (schema == null) return undefined;

  try {
    // Plain objects that are already JSON-safe
    const json = JSON.stringify(schema, safeJsonReplacer);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return { type: "unknown", description: "Schema not serializable" };
  }
}

/**
 * Deep-clean a value for safe JSON serialization.
 * Converts functions to "[Function]", ReactElements ($$typeof) to
 * "[ReactElement]", undefined to null, and detects circular references.
 * @param value - Any value to clean
 * @returns A JSON-safe copy of the value
 */
function deepCleanForJson(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value, safeJsonReplacer));
  } catch {
    return "[Unserializable]";
  }
}

/**
 * JSON replacer that handles non-serializable values safely.
 * Uses a WeakSet to detect circular references.
 * @returns A safe JSON replacer function
 */
function createSafeReplacer(): (key: string, value: unknown) => unknown {
  const seen = new WeakSet<object>();

  return (_key: string, value: unknown): unknown => {
    if (value === undefined) return null;
    if (typeof value === "function") return "[Function]";
    if (typeof value === "bigint") return `${value}`;
    if (typeof value === "symbol") return value.toString();

    if (typeof value === "object" && value !== null) {
      // Detect React elements by $$typeof
      if (
        "$$typeof" in value &&
        typeof (value as Record<string, unknown>).$$typeof === "symbol"
      ) {
        return "[ReactElement]";
      }

      // Circular reference detection
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }

    return value;
  };
}

/**
 * Shared safe JSON replacer instance.
 * Note: Each call to JSON.stringify needs a fresh replacer for the WeakSet,
 * so we use a factory. This variable is just for simple single-pass usage.
 */
function safeJsonReplacer(key: string, value: unknown): unknown {
  // For top-level calls we create a fresh replacer
  return createSafeReplacer()(key, value);
}
