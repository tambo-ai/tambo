import type { RouterOutputs } from "@/trpc/react";
import {
  GenerationStage,
  MessageRole,
  V1RunStatus,
} from "@tambo-ai-cloud/core";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

/**
 * Creates a mock thread message that matches the tRPC router output type
 */
export function createMockThreadMessage(
  id: string,
  threadId: string,
  role: MessageRole = MessageRole.User,
  overrides: Partial<MessageType> = {},
): MessageType {
  const now = new Date();

  const baseMessage: MessageType = {
    id,
    threadId,
    role,
    parentMessageId: undefined,
    content: [{ type: "text", text: "Hello" }],
    additionalContext: null,
    toolCallId: null,
    componentDecision: undefined,
    componentState: null,
    actionType: null,
    error: null,
    metadata: null,
    isCancelled: false,
    createdAt: now,
    reasoning: null,
    reasoningDurationMS: null,
    suggestedActions: [],
    suggestions: [],
    toolCallRequest: undefined,
  };

  return { ...baseMessage, ...overrides };
}

/**
 * Creates a mock thread that matches the tRPC router output type
 */
export function createMockThread(
  id: string,
  projectId: string,
  overrides: Partial<ThreadType> = {},
): ThreadType {
  const now = new Date();

  const baseThread: ThreadType = {
    id,
    name: "Test Thread",
    projectId,
    contextKey: "test-context",
    metadata: {},
    generationStage: GenerationStage.COMPLETE,
    statusMessage: null,
    createdAt: now,
    updatedAt: now,
    messages: [],
    // v1 API run lifecycle fields
    runStatus: V1RunStatus.IDLE,
    currentRunId: null,
    lastRunCancelled: null,
    lastRunError: null,
    pendingToolCallIds: null,
    lastCompletedRunId: null,
  };

  return { ...baseThread, ...overrides };
}

/**
 * Creates a complete thread with messages for testing ThreadMessages component
 */
export function createMockThreadWithMessages(
  threadId: string = "thread-1",
  projectId: string = "project-1",
): ThreadType {
  const messages: MessageType[] = [
    createMockThreadMessage("msg-1", threadId, MessageRole.User, {
      content: [{ type: "text", text: "Hello" }],
      createdAt: new Date("2024-01-01T10:00:00Z"),
    }),
    createMockThreadMessage("msg-2", threadId, MessageRole.Assistant, {
      content: [{ type: "text", text: "Hi there" }],
      createdAt: new Date("2024-01-01T10:01:00Z"),
      toolCallRequest: {
        tool_call_id: "tool-1",
        toolName: "test-tool",
        parameters: [
          {
            parameterName: "param1",
            parameterValue: "value1",
          },
        ],
      },
      toolCallId: "tool-1",
    }),
    createMockThreadMessage("msg-3", threadId, MessageRole.Tool, {
      content: [{ type: "text", text: "Tool response" }],
      createdAt: new Date("2024-01-01T10:02:00Z"),
      toolCallId: "tool-1",
    }),
    createMockThreadMessage("msg-4", threadId, MessageRole.Assistant, {
      content: [{ type: "text", text: "Response with component" }],
      createdAt: new Date("2024-01-01T10:03:00Z"),
      componentDecision: {
        message: "Test component message",
        componentName: "test-component",
        componentState: {},
        props: {},
      },
    }),
  ];

  return createMockThread(threadId, projectId, { messages });
}

/**
 * Creates a thread with messages for testing same day grouping
 */
export function createMockThreadSameDay(
  threadId: string = "thread-same-day",
  projectId: string = "project-1",
): ThreadType {
  const messages: MessageType[] = [
    createMockThreadMessage("msg-1", threadId, MessageRole.User, {
      content: [{ type: "text", text: "Hello" }],
      createdAt: new Date("2024-01-01T10:00:00Z"),
    }),
    createMockThreadMessage("msg-2", threadId, MessageRole.Assistant, {
      content: [{ type: "text", text: "Hi there" }],
      createdAt: new Date("2024-01-01T11:00:00Z"),
    }),
  ];

  return createMockThread(threadId, projectId, { messages });
}

/**
 * Creates a thread with messages for testing different day grouping
 */
export function createMockThreadDifferentDays(
  threadId: string = "thread-different-days",
  projectId: string = "project-1",
): ThreadType {
  const messages: MessageType[] = [
    createMockThreadMessage("msg-1", threadId, MessageRole.User, {
      content: [{ type: "text", text: "Hello" }],
      createdAt: new Date("2024-01-01T10:00:00Z"),
    }),
    createMockThreadMessage("msg-2", threadId, MessageRole.Assistant, {
      content: [{ type: "text", text: "Hi there" }],
      createdAt: new Date("2024-01-02T10:00:00Z"),
    }),
  ];

  return createMockThread(threadId, projectId, { messages });
}

/**
 * Creates a thread without tool response for testing graceful handling
 */
export function createMockThreadWithoutToolResponse(
  threadId: string = "thread-no-tool-response",
  projectId: string = "project-1",
): ThreadType {
  const messages: MessageType[] = [
    createMockThreadMessage("msg-1", threadId, MessageRole.Assistant, {
      content: [{ type: "text", text: "Hi there" }],
      createdAt: new Date("2024-01-01T10:01:00Z"),
      toolCallRequest: {
        toolName: "test-tool",
        parameters: [],
      },
      toolCallId: "tool-1",
    }),
    // No corresponding tool response message
  ];

  return createMockThread(threadId, projectId, { messages });
}

/**
 * Creates a thread with a small system message (should not collapse)
 */
export function createMockThreadWithSmallSystemMessage(
  threadId: string = "thread-small-system",
  projectId: string = "project-1",
): ThreadType {
  const messages: MessageType[] = [
    createMockThreadMessage("msg-system", threadId, MessageRole.System, {
      content: [{ type: "text", text: "Small system prompt" }],
      createdAt: new Date("2024-01-01T09:59:00Z"),
    }),
    createMockThreadMessage("msg-1", threadId, MessageRole.User, {
      content: [{ type: "text", text: "Hello" }],
      createdAt: new Date("2024-01-01T10:00:00Z"),
    }),
    createMockThreadMessage("msg-2", threadId, MessageRole.Assistant, {
      content: [{ type: "text", text: "Hi there" }],
      createdAt: new Date("2024-01-01T10:01:00Z"),
    }),
  ];

  return createMockThread(threadId, projectId, { messages });
}

/**
 * Creates a thread with a large system message (should collapse)
 */
export function createMockThreadWithLargeSystemMessage(
  threadId: string = "thread-large-system",
  projectId: string = "project-1",
): ThreadType {
  // Create a large system message that exceeds the collapse threshold
  const largeContent = "A".repeat(600); // > 500 characters
  const messages: MessageType[] = [
    createMockThreadMessage("msg-system", threadId, MessageRole.System, {
      content: [{ type: "text", text: largeContent }],
      createdAt: new Date("2024-01-01T09:59:00Z"),
    }),
    createMockThreadMessage("msg-1", threadId, MessageRole.User, {
      content: [{ type: "text", text: "Hello" }],
      createdAt: new Date("2024-01-01T10:00:00Z"),
    }),
    createMockThreadMessage("msg-2", threadId, MessageRole.Assistant, {
      content: [{ type: "text", text: "Hi there" }],
      createdAt: new Date("2024-01-01T10:01:00Z"),
    }),
  ];

  return createMockThread(threadId, projectId, { messages });
}

/**
 * Creates a thread with a system message that's not the first message (should not collapse)
 */
export function createMockThreadWithNonFirstSystemMessage(
  threadId: string = "thread-non-first-system",
  projectId: string = "project-1",
): ThreadType {
  const largeContent = "A".repeat(600); // > 500 characters
  const messages: MessageType[] = [
    createMockThreadMessage("msg-1", threadId, MessageRole.User, {
      content: [{ type: "text", text: "Hello" }],
      createdAt: new Date("2024-01-01T10:00:00Z"),
    }),
    createMockThreadMessage("msg-system", threadId, MessageRole.System, {
      content: [{ type: "text", text: largeContent }],
      createdAt: new Date("2024-01-01T09:59:00Z"),
    }),
    createMockThreadMessage("msg-2", threadId, MessageRole.Assistant, {
      content: [{ type: "text", text: "Hi there" }],
      createdAt: new Date("2024-01-01T10:01:00Z"),
    }),
  ];

  return createMockThread(threadId, projectId, { messages });
}

/**
 * Creates search matches for testing search functionality
 */
export function createMockSearchMatches(): Array<{
  messageId: string;
  messageType: "message" | "tool_call" | "component";
  contentType:
    | "content"
    | "toolArgs"
    | "toolResponse"
    | "componentProps"
    | "additionalContext";
}> {
  return [
    {
      messageId: "msg-1",
      messageType: "message" as const,
      contentType: "content" as const,
    },
  ];
}
