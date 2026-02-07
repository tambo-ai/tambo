import {
  EventType,
  type CustomEvent,
  type RunErrorEvent,
  type RunFinishedEvent,
  type RunStartedEvent,
  type StateSnapshotEvent,
  type TextMessageContentEvent,
  type TextMessageEndEvent,
  type TextMessageStartEvent,
  type ThinkingTextMessageContentEvent,
  type ThinkingTextMessageEndEvent,
  type ThinkingTextMessageStartEvent,
  type ToolCallArgsEvent,
  type ToolCallEndEvent,
  type ToolCallResultEvent,
  type ToolCallStartEvent,
} from "@ag-ui/core";
import type { ToolUseContent } from "@tambo-ai/typescript-sdk/resources/threads/threads";
import {
  createInitialState,
  createInitialThreadState,
  streamReducer,
  type StreamState,
  type ThreadState,
} from "./event-accumulator";
import type { Content, V1ComponentContent } from "../types/message";

/**
 * Helper to extract a ToolUseContent from a message content array.
 * @param content - Content array from a message
 * @param index - Index of the content item
 * @returns The content as ToolUseContent
 */
function asToolUseContent(content: Content[], index: number): ToolUseContent {
  return content[index] as ToolUseContent;
}

/**
 * Helper to extract a V1ComponentContent from a message content array.
 * @param content - Content array from a message
 * @param index - Index of the content item
 * @returns The content as V1ComponentContent
 */
function asComponentContent(
  content: Content[],
  index: number,
): V1ComponentContent {
  return content[index] as V1ComponentContent;
}

// Helper to create a base thread state for testing
function createTestThreadState(threadId: string): ThreadState {
  return {
    ...createInitialThreadState(threadId),
    thread: {
      ...createInitialThreadState(threadId).thread,
      // Use fixed timestamps for snapshot stability
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      lastRunCancelled: false,
    },
  };
}

// Helper to create stream state with a thread
function createTestStreamState(threadId: string): StreamState {
  return {
    threadMap: {
      [threadId]: createTestThreadState(threadId),
    },
    currentThreadId: threadId,
  };
}

describe("createInitialThreadState", () => {
  it("creates thread state with correct structure", () => {
    const state = createInitialThreadState("thread_123");

    expect(state.thread.id).toBe("thread_123");
    expect(state.thread.messages).toEqual([]);
    expect(state.thread.status).toBe("idle");
    expect(state.streaming.status).toBe("idle");
    expect(state.accumulatingToolArgs).toBeInstanceOf(Map);
    expect(state.accumulatingToolArgs.size).toBe(0);
  });
});

describe("createInitialState", () => {
  it("creates initial state with placeholder thread", () => {
    const state = createInitialState();

    expect(state.currentThreadId).toBe("placeholder");
    expect(state.threadMap.placeholder).toBeDefined();
    expect(state.threadMap.placeholder.thread.id).toBe("placeholder");
    expect(state.threadMap.placeholder.thread.messages).toEqual([]);
    expect(state.threadMap.placeholder.streaming.status).toBe("idle");
  });
});

describe("streamReducer", () => {
  // Mock console.warn for tests that check logging
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe("unknown thread handling", () => {
    it("auto-initializes unknown thread when receiving events", () => {
      const state = createInitialState();
      const event: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_1",
        threadId: "unknown_thread",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "unknown_thread",
      });

      // Should auto-initialize the thread rather than dropping the event
      expect(result.threadMap.unknown_thread).toBeDefined();
      expect(result.threadMap.unknown_thread.thread.id).toBe("unknown_thread");
      expect(result.threadMap.unknown_thread.streaming.status).toBe(
        "streaming",
      );
      expect(result.threadMap.unknown_thread.streaming.runId).toBe("run_1");
      // No warning should be logged for auto-initialization
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe("unsupported event types", () => {
    it("logs warning for unsupported AG-UI events", () => {
      const state = createTestStreamState("thread_1");
      const event: StateSnapshotEvent = {
        type: EventType.STATE_SNAPSHOT,
        snapshot: {},
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      expect(result).toBe(state);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("unsupported event type"),
      );
    });

    it("throws for completely unknown event types (fail-fast)", () => {
      const state = createTestStreamState("thread_1");
      // Create an event with an unknown type (not in EventType enum)
      // This tests fail-fast behavior when SDK returns unexpected event types
      const event = {
        type: "TOTALLY_UNKNOWN_EVENT_TYPE",
      };

      expect(() =>
        streamReducer(state, {
          type: "EVENT",
          event: event as unknown as RunStartedEvent,
          threadId: "thread_1",
        }),
      ).toThrow("Unreachable case");
    });

    it("logs warning for unknown custom event names", () => {
      const state = createTestStreamState("thread_1");
      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "unknown.custom.event",
        value: {},
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      expect(result.threadMap.thread_1).toBe(state.threadMap.thread_1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown custom event name"),
      );
    });
  });

  describe("RUN_STARTED event", () => {
    it("updates thread status to streaming", () => {
      const state = createTestStreamState("thread_1");
      const event: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_123",
        threadId: "thread_1",
        timestamp: 1704067200000,
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      expect(result.threadMap.thread_1.thread.status).toBe("streaming");
      expect(result.threadMap.thread_1.streaming.status).toBe("streaming");
      expect(result.threadMap.thread_1.streaming.runId).toBe("run_123");
    });

    it("resets lastRunCancelled to false when a new run starts", () => {
      // Start with a thread that was cancelled
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.lastRunCancelled = true;

      const event: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_123",
        threadId: "thread_1",
        timestamp: 1704067200000,
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      // lastRunCancelled should be reset to false
      expect(result.threadMap.thread_1.thread.lastRunCancelled).toBe(false);
    });

    it("uses provided timestamp for startTime", () => {
      const state = createTestStreamState("thread_1");
      const event: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_123",
        threadId: "thread_1",
        timestamp: 1704067200000,
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      expect(result.threadMap.thread_1.streaming.startTime).toBe(1704067200000);
    });

    it("does not switch currentThreadId when placeholder has no messages", () => {
      const state = createInitialState();
      const realThreadId = "thread_real_123";
      const runStartedEvent: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_456",
        threadId: realThreadId,
        timestamp: 1704067200000,
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event: runStartedEvent,
        threadId: realThreadId,
      });

      expect(result.threadMap.placeholder.thread.messages).toHaveLength(0);
      expect(result.currentThreadId).toBe("placeholder");
    });

    it("migrates messages from placeholder thread to real thread", () => {
      // Start with initial state (which has placeholder thread)
      const state = createInitialState();

      // Verify placeholder thread exists
      expect(state.currentThreadId).toBe("placeholder");

      // Add a user message to the placeholder thread
      const userMsgStart: TextMessageStartEvent = {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "user_msg_1",
        role: "user",
      };
      const userMsgContent: TextMessageContentEvent = {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "user_msg_1",
        delta: "Hello",
      };
      const userMsgEnd: TextMessageEndEvent = {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "user_msg_1",
      };

      let stateWithUserMsg = streamReducer(state, {
        type: "EVENT",
        event: userMsgStart,
        threadId: "placeholder",
      });
      stateWithUserMsg = streamReducer(stateWithUserMsg, {
        type: "EVENT",
        event: userMsgContent,
        threadId: "placeholder",
      });
      stateWithUserMsg = streamReducer(stateWithUserMsg, {
        type: "EVENT",
        event: userMsgEnd,
        threadId: "placeholder",
      });

      // Verify placeholder thread has the message
      expect(stateWithUserMsg.currentThreadId).toBe("placeholder");
      expect(
        stateWithUserMsg.threadMap.placeholder.thread.messages,
      ).toHaveLength(1);
      expect(
        stateWithUserMsg.threadMap.placeholder.thread.messages[0].content[0],
      ).toEqual({
        type: "text",
        text: "Hello",
      });

      // Now RUN_STARTED arrives with the real thread ID
      const realThreadId = "thread_real_123";
      const runStartedEvent: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_456",
        threadId: realThreadId,
        timestamp: 1704067200000,
      };

      const finalState = streamReducer(stateWithUserMsg, {
        type: "EVENT",
        event: runStartedEvent,
        threadId: realThreadId,
      });

      // Placeholder thread should be reset to empty (not removed)
      expect(finalState.threadMap.placeholder).toBeDefined();
      expect(finalState.threadMap.placeholder.thread.messages).toHaveLength(0);

      // Real thread should have the migrated user message
      expect(finalState.threadMap[realThreadId]).toBeDefined();
      expect(finalState.threadMap[realThreadId].thread.messages).toHaveLength(
        1,
      );
      expect(
        finalState.threadMap[realThreadId].thread.messages[0].content[0],
      ).toEqual({
        type: "text",
        text: "Hello",
      });

      // currentThreadId should be updated to real thread
      expect(finalState.currentThreadId).toBe(realThreadId);

      // Real thread should be in streaming state
      expect(finalState.threadMap[realThreadId].thread.status).toBe(
        "streaming",
      );
      expect(finalState.threadMap[realThreadId].streaming.runId).toBe(
        "run_456",
      );
    });

    it("migrates messages even if currentThreadId changes away from placeholder", () => {
      let state = createInitialState();
      state = streamReducer(state, {
        type: "INIT_THREAD",
        threadId: "thread_1",
      });
      state = streamReducer(state, {
        type: "SET_CURRENT_THREAD",
        threadId: "thread_1",
      });

      const userMsgStart: TextMessageStartEvent = {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "user_msg_1",
        role: "user",
      };
      const userMsgContent: TextMessageContentEvent = {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "user_msg_1",
        delta: "Hello",
      };
      const userMsgEnd: TextMessageEndEvent = {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "user_msg_1",
      };

      state = streamReducer(state, {
        type: "EVENT",
        event: userMsgStart,
        threadId: "placeholder",
      });
      state = streamReducer(state, {
        type: "EVENT",
        event: userMsgContent,
        threadId: "placeholder",
      });
      state = streamReducer(state, {
        type: "EVENT",
        event: userMsgEnd,
        threadId: "placeholder",
      });

      const realThreadId = "thread_real_123";
      const runStartedEvent: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_456",
        threadId: realThreadId,
        timestamp: 1704067200000,
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event: runStartedEvent,
        threadId: realThreadId,
      });

      expect(result.threadMap.placeholder.thread.messages).toHaveLength(0);
      expect(result.threadMap[realThreadId].thread.messages).toHaveLength(1);
      expect(result.currentThreadId).toBe("thread_1");
    });

    it("prefers event.threadId over action threadId when RUN_STARTED is dispatched", () => {
      // Start with initial state (which has placeholder thread)
      const state = createInitialState();

      // Add a user message to the placeholder thread
      const userMsgStart: TextMessageStartEvent = {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "user_msg_1",
        role: "user",
      };
      const userMsgContent: TextMessageContentEvent = {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "user_msg_1",
        delta: "Hello",
      };
      const userMsgEnd: TextMessageEndEvent = {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "user_msg_1",
      };

      let stateWithUserMsg = streamReducer(state, {
        type: "EVENT",
        event: userMsgStart,
        threadId: "placeholder",
      });
      stateWithUserMsg = streamReducer(stateWithUserMsg, {
        type: "EVENT",
        event: userMsgContent,
        threadId: "placeholder",
      });
      stateWithUserMsg = streamReducer(stateWithUserMsg, {
        type: "EVENT",
        event: userMsgEnd,
        threadId: "placeholder",
      });

      const realThreadId = "thread_real_123";
      const runStartedEvent: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_456",
        threadId: realThreadId,
        timestamp: 1704067200000,
      };

      const result = streamReducer(stateWithUserMsg, {
        type: "EVENT",
        event: runStartedEvent,
        threadId: "placeholder",
      });

      expect(result.threadMap.placeholder.thread.messages).toHaveLength(0);
      expect(result.threadMap[realThreadId].thread.messages).toHaveLength(1);
      expect(result.currentThreadId).toBe(realThreadId);
    });
  });

  describe("RUN_FINISHED event", () => {
    it("updates thread status to complete", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.status = "streaming";
      state.threadMap.thread_1.streaming.status = "streaming";

      const event: RunFinishedEvent = {
        type: EventType.RUN_FINISHED,
        runId: "run_123",
        threadId: "thread_1",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      expect(result.threadMap.thread_1.thread.status).toBe("complete");
      expect(result.threadMap.thread_1.streaming.status).toBe("complete");
    });
  });

  describe("RUN_ERROR event", () => {
    it("updates thread status to error with details", () => {
      const state = createTestStreamState("thread_1");
      const event: RunErrorEvent = {
        type: EventType.RUN_ERROR,
        message: "Something went wrong",
        code: "ERR_001",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      expect(result.threadMap.thread_1.thread.status).toBe("error");
      expect(result.threadMap.thread_1.streaming.status).toBe("error");
      expect(result.threadMap.thread_1.streaming.error).toEqual({
        message: "Something went wrong",
        code: "ERR_001",
      });
    });

    it("sets lastRunCancelled and idle status when code is CANCELLED", () => {
      const state = createTestStreamState("thread_1");
      const event: RunErrorEvent = {
        type: EventType.RUN_ERROR,
        message: "Run cancelled",
        code: "CANCELLED",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      // Cancelled runs should show as idle, not error
      expect(result.threadMap.thread_1.thread.status).toBe("idle");
      expect(result.threadMap.thread_1.streaming.status).toBe("idle");
      // lastRunCancelled should be set
      expect(result.threadMap.thread_1.thread.lastRunCancelled).toBe(true);
      // No error should be stored for cancelled runs
      expect(result.threadMap.thread_1.streaming.error).toBeUndefined();
    });
  });

  describe("TEXT_MESSAGE_START event", () => {
    it("creates new message in thread", () => {
      const state = createTestStreamState("thread_1");
      const event: TextMessageStartEvent = {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg_1",
        role: "assistant",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const messages = result.threadMap.thread_1.thread.messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe("msg_1");
      expect(messages[0].role).toBe("assistant");
      expect(messages[0].content).toEqual([]);
    });

    it("creates user message when role is user", () => {
      const state = createTestStreamState("thread_1");
      const event: TextMessageStartEvent = {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg_1",
        role: "user",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const messages = result.threadMap.thread_1.thread.messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("user");
    });
  });

  describe("TEXT_MESSAGE_CONTENT event", () => {
    it("appends text content to message", () => {
      const state = createTestStreamState("thread_1");
      // Add a message first
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: TextMessageContentEvent = {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "msg_1",
        delta: "Hello ",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const content = result.threadMap.thread_1.thread.messages[0].content;
      expect(content).toHaveLength(1);
      expect(content[0]).toEqual({ type: "text", text: "Hello " });
    });

    it("creates new text block after non-text content", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            { type: "tool_use", id: "tool_1", name: "test", input: {} },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: TextMessageContentEvent = {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "msg_1",
        delta: "After tool call",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const content = result.threadMap.thread_1.thread.messages[0].content;
      expect(content).toHaveLength(2);
      expect(content[0]).toEqual({
        type: "tool_use",
        id: "tool_1",
        name: "test",
        input: {},
      });
      expect(content[1]).toEqual({ type: "text", text: "After tool call" });
    });

    it("accumulates text content deltas", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [{ type: "text", text: "Hello " }],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: TextMessageContentEvent = {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "msg_1",
        delta: "world!",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const content = result.threadMap.thread_1.thread.messages[0].content;
      expect(content).toHaveLength(1);
      expect(content[0]).toEqual({ type: "text", text: "Hello world!" });
    });

    it("throws when message not found", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: TextMessageContentEvent = {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "unknown_msg",
        delta: "Hello",
      };

      expect(() => {
        streamReducer(state, {
          type: "EVENT",
          event,
          threadId: "thread_1",
        });
      }).toThrow("Message unknown_msg not found");
    });
  });

  describe("TEXT_MESSAGE_END event", () => {
    it("throws when messageId doesn't match active message", () => {
      const state = createTestStreamState("thread_1");
      // Set up an active message in streaming state
      state.threadMap.thread_1.streaming.messageId = "msg_1";
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: TextMessageEndEvent = {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "wrong_msg_id",
      };

      expect(() => {
        streamReducer(state, {
          type: "EVENT",
          event,
          threadId: "thread_1",
        });
      }).toThrow("TEXT_MESSAGE_END messageId mismatch");
    });

    it("clears active messageId on success", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.streaming.messageId = "msg_1";
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: TextMessageEndEvent = {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "msg_1",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      expect(result.threadMap.thread_1.streaming.messageId).toBeUndefined();
    });
  });

  describe("TOOL_CALL_START event", () => {
    it("adds tool_use content block to message", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: ToolCallStartEvent = {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool_1",
        toolCallName: "get_weather",
        parentMessageId: "msg_1",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const content = result.threadMap.thread_1.thread.messages[0].content;
      expect(content).toHaveLength(1);
      expect(content[0]).toEqual({
        type: "tool_use",
        id: "tool_1",
        name: "get_weather",
        input: {},
      });
    });
  });

  describe("TOOL_CALL_START event", () => {
    it("uses last message when no parentMessageId provided", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: ToolCallStartEvent = {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool_1",
        toolCallName: "get_weather",
        // No parentMessageId - should use last message
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const content = result.threadMap.thread_1.thread.messages[0].content;
      expect(content).toHaveLength(1);
      expect(content[0]).toEqual({
        type: "tool_use",
        id: "tool_1",
        name: "get_weather",
        input: {},
      });
    });

    it("creates synthetic message when parentMessageId not found", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: ToolCallStartEvent = {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool_1",
        toolCallName: "get_weather",
        parentMessageId: "unknown_msg",
      };

      // When parentMessageId not found, creates a synthetic message
      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      // Should create a synthetic message with the tool call
      const messages = result.threadMap.thread_1.thread.messages;
      expect(messages).toHaveLength(2); // Original + synthetic
      expect(messages[1].id).toBe("unknown_msg");
      expect(messages[1].role).toBe("assistant");
      expect(messages[1].content).toHaveLength(1);
      expect(messages[1].content[0]).toMatchObject({
        type: "tool_use",
        id: "tool_1",
        name: "get_weather",
      });
    });

    it("creates synthetic message when no messages exist", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [];

      const event: ToolCallStartEvent = {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool_1",
        toolCallName: "get_weather",
        // No parentMessageId, no messages
      };

      // When no messages exist, creates a synthetic message
      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const messages = result.threadMap.thread_1.thread.messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe("msg_tool_tool_1");
      expect(messages[0].role).toBe("assistant");
      expect(messages[0].content).toHaveLength(1);
      expect(messages[0].content[0]).toMatchObject({
        type: "tool_use",
        id: "tool_1",
        name: "get_weather",
      });
    });
  });

  describe("TOOL_CALL_ARGS and TOOL_CALL_END events", () => {
    it("handles TOOL_CALL_END with no accumulated args", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            { type: "tool_use", id: "tool_1", name: "test", input: {} },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      // Send TOOL_CALL_END without any TOOL_CALL_ARGS first
      const endEvent: ToolCallEndEvent = {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool_1",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event: endEvent,
        threadId: "thread_1",
      });

      // Should return unchanged state since no args were accumulated
      expect(result.threadMap.thread_1).toBe(state.threadMap.thread_1);
    });

    it("accumulates and parses tool arguments", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            { type: "tool_use", id: "tool_1", name: "test", input: {} },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      // Send TOOL_CALL_ARGS
      const argsEvent1: ToolCallArgsEvent = {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool_1",
        delta: '{"city":',
      };

      let result = streamReducer(state, {
        type: "EVENT",
        event: argsEvent1,
        threadId: "thread_1",
      });

      const argsEvent2: ToolCallArgsEvent = {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool_1",
        delta: '"NYC"}',
      };

      result = streamReducer(result, {
        type: "EVENT",
        event: argsEvent2,
        threadId: "thread_1",
      });

      // Send TOOL_CALL_END
      const endEvent: ToolCallEndEvent = {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool_1",
      };

      result = streamReducer(result, {
        type: "EVENT",
        event: endEvent,
        threadId: "thread_1",
      });

      const toolContent = asToolUseContent(
        result.threadMap.thread_1.thread.messages[0].content,
        0,
      );
      expect(toolContent.input).toEqual({ city: "NYC" });
    });

    it("optimistically parses partial tool args during streaming", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            { type: "tool_use", id: "tool_1", name: "test", input: {} },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      // First chunk: partial key — partial-json can parse this into { city: "" }
      let result = streamReducer(state, {
        type: "EVENT",
        event: {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "tool_1",
          delta: '{"city": "N',
        } satisfies ToolCallArgsEvent,
        threadId: "thread_1",
      });

      let toolContent = asToolUseContent(
        result.threadMap.thread_1.thread.messages[0].content,
        0,
      );
      // partial-json parses incomplete string values
      expect(toolContent.input).toEqual({ city: "N" });

      // Second chunk: complete city, start of units
      result = streamReducer(result, {
        type: "EVENT",
        event: {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "tool_1",
          delta: 'YC", "units": "fahr',
        } satisfies ToolCallArgsEvent,
        threadId: "thread_1",
      });

      toolContent = asToolUseContent(
        result.threadMap.thread_1.thread.messages[0].content,
        0,
      );
      expect(toolContent.input).toEqual({ city: "NYC", units: "fahr" });

      // Final chunk + TOOL_CALL_END
      result = streamReducer(result, {
        type: "EVENT",
        event: {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "tool_1",
          delta: 'enheit"}',
        } satisfies ToolCallArgsEvent,
        threadId: "thread_1",
      });

      result = streamReducer(result, {
        type: "EVENT",
        event: {
          type: EventType.TOOL_CALL_END,
          toolCallId: "tool_1",
        } satisfies ToolCallEndEvent,
        threadId: "thread_1",
      });

      toolContent = asToolUseContent(
        result.threadMap.thread_1.thread.messages[0].content,
        0,
      );
      expect(toolContent.input).toEqual({
        city: "NYC",
        units: "fahrenheit",
      });
    });

    it("throws when tool arguments JSON is invalid", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            { type: "tool_use", id: "tool_1", name: "test", input: {} },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      // Send invalid JSON via TOOL_CALL_ARGS
      const argsEvent: ToolCallArgsEvent = {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool_1",
        delta: "{invalid json",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event: argsEvent,
        threadId: "thread_1",
      });

      // Send TOOL_CALL_END - should throw when parsing
      const endEvent: ToolCallEndEvent = {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool_1",
      };

      expect(() => {
        streamReducer(result, {
          type: "EVENT",
          event: endEvent,
          threadId: "thread_1",
        });
      }).toThrow("Failed to parse tool call arguments");
    });

    it("uses parsedToolArgs from action when provided (skips own parsing)", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            { type: "tool_use", id: "tool_1", name: "test", input: {} },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const preParsed = { city: "Seattle", units: "celsius" };

      const result = streamReducer(state, {
        type: "EVENT",
        event: {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "tool_1",
          // Deliberately incomplete JSON — if the reducer re-parses, it would not match preParsed
          delta: '{"city": "Seat',
        } satisfies ToolCallArgsEvent,
        threadId: "thread_1",
        parsedToolArgs: preParsed,
      });

      const toolContent = asToolUseContent(
        result.threadMap.thread_1.thread.messages[0].content,
        0,
      );
      // Should use the pre-parsed value, not the incomplete delta
      expect(toolContent.input).toEqual(preParsed);
    });
  });

  describe("custom component events", () => {
    it("handles tambo.component.start event", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.start",
        value: {
          messageId: "msg_1",
          componentId: "comp_1",
          componentName: "WeatherCard",
        },
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const content = result.threadMap.thread_1.thread.messages[0].content;
      expect(content).toHaveLength(1);
      expect(content[0]).toEqual({
        type: "component",
        id: "comp_1",
        name: "WeatherCard",
        props: {},
        streamingState: "started",
      });
    });

    it("handles tambo.component.props_delta event", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            {
              type: "component",
              id: "comp_1",
              name: "Test",
              props: {},
              streamingState: "started",
            },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.props_delta",
        value: {
          componentId: "comp_1",
          operations: [{ op: "add", path: "/temperature", value: 72 }],
        },
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const component = asComponentContent(
        result.threadMap.thread_1.thread.messages[0].content,
        0,
      );
      expect(component.props).toEqual({ temperature: 72 });
      expect(component.streamingState).toBe("streaming");
    });

    it("throws when component not found for props_delta", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [], // No component
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.props_delta",
        value: {
          componentId: "unknown_comp",
          operations: [{ op: "add", path: "/value", value: 1 }],
        },
      };

      expect(() => {
        streamReducer(state, {
          type: "EVENT",
          event,
          threadId: "thread_1",
        });
      }).toThrow("component unknown_comp not found");
    });

    it("handles tambo.run.awaiting_input event", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.status = "streaming";

      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.run.awaiting_input",
        value: {
          pendingToolCalls: [
            { toolCallId: "tool_1", toolName: "test1", arguments: "{}" },
            { toolCallId: "tool_2", toolName: "test2", arguments: "{}" },
          ],
        },
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      expect(result.threadMap.thread_1.thread.status).toBe("waiting");
      expect(result.threadMap.thread_1.streaming.status).toBe("waiting");
    });

    it("handles tambo.component.state_delta event", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            {
              type: "component",
              id: "comp_1",
              name: "Counter",
              props: {},
              streamingState: "started",
            },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.state_delta",
        value: {
          componentId: "comp_1",
          operations: [{ op: "add", path: "/count", value: 42 }],
        },
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const component = asComponentContent(
        result.threadMap.thread_1.thread.messages[0].content,
        0,
      );
      expect(component.state).toEqual({ count: 42 });
      expect(component.streamingState).toBe("streaming");
    });

    it("handles tambo.component.end event", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            {
              type: "component",
              id: "comp_1",
              name: "Test",
              props: {},
              streamingState: "streaming",
            },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.end",
        value: { componentId: "comp_1" },
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      // component.end sets streamingState to 'done'
      expect(result.threadMap.thread_1.thread.messages[0].content[0]).toEqual({
        type: "component",
        id: "comp_1",
        name: "Test",
        props: {},
        streamingState: "done",
      });
    });

    it("creates message on-demand when not found for tambo.component.start", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.start",
        value: {
          messageId: "unknown_msg",
          componentId: "comp_1",
          componentName: "Test",
        },
      };

      // Should create the message on-demand instead of throwing
      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      // Verify the message was created
      const messages = result.threadMap.thread_1.thread.messages;
      expect(messages).toHaveLength(2);
      expect(messages[1].id).toBe("unknown_msg");
      expect(messages[1].role).toBe("assistant");
      // And the component was added to it
      expect(messages[1].content).toHaveLength(1);
      expect(messages[1].content[0]).toMatchObject({
        type: "component",
        id: "comp_1",
        name: "Test",
      });
    });

    it("throws when component not found for tambo.component.end", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.end",
        value: { componentId: "unknown_comp" },
      };

      expect(() => {
        streamReducer(state, {
          type: "EVENT",
          event,
          threadId: "thread_1",
        });
      }).toThrow("component unknown_comp not found");
    });

    it("handles multiple component props_delta operations", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            {
              type: "component",
              id: "comp_1",
              name: "Test",
              props: { existing: "value" },
              streamingState: "started",
            },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.props_delta",
        value: {
          componentId: "comp_1",
          operations: [
            { op: "add", path: "/newProp", value: "new" },
            { op: "replace", path: "/existing", value: "updated" },
          ],
        },
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const component = asComponentContent(
        result.threadMap.thread_1.thread.messages[0].content,
        0,
      );
      expect(component.props).toEqual({
        existing: "updated",
        newProp: "new",
      });
    });

    it("handles multiple components in same message", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            {
              type: "component",
              id: "comp_1",
              name: "First",
              props: {},
              streamingState: "done",
            },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      // Add second component
      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.start",
        value: {
          messageId: "msg_1",
          componentId: "comp_2",
          componentName: "Second",
        },
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const content = result.threadMap.thread_1.thread.messages[0].content;
      expect(content).toHaveLength(2);
      expect(asComponentContent(content, 0).id).toBe("comp_1");
      expect(asComponentContent(content, 1).id).toBe("comp_2");
    });

    it("updates correct component when multiple exist", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            {
              type: "component",
              id: "comp_1",
              name: "First",
              props: { value: 1 },
              streamingState: "done",
            },
            {
              type: "component",
              id: "comp_2",
              name: "Second",
              props: { value: 2 },
              streamingState: "streaming",
            },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      // Update second component
      const event: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.props_delta",
        value: {
          componentId: "comp_2",
          operations: [{ op: "replace", path: "/value", value: 99 }],
        },
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const content = result.threadMap.thread_1.thread.messages[0].content;
      // First component unchanged
      expect(asComponentContent(content, 0).props).toEqual({ value: 1 });
      // Second component updated
      expect(asComponentContent(content, 1).props).toEqual({ value: 99 });
    });
  });

  describe("snapshot tests for complex state transitions", () => {
    it("matches snapshot for full message flow", () => {
      let state = createTestStreamState("thread_1");

      // RUN_STARTED
      const runStarted: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_1",
        threadId: "thread_1",
        timestamp: 1704067200000,
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: runStarted,
        threadId: "thread_1",
      });

      // TEXT_MESSAGE_START
      const msgStart: TextMessageStartEvent = {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg_1",
        role: "assistant",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: msgStart,
        threadId: "thread_1",
      });

      // TEXT_MESSAGE_CONTENT
      const msgContent: TextMessageContentEvent = {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "msg_1",
        delta: "Hello, how can I help?",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: msgContent,
        threadId: "thread_1",
      });

      // TEXT_MESSAGE_END
      const msgEnd: TextMessageEndEvent = {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "msg_1",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: msgEnd,
        threadId: "thread_1",
      });

      // RUN_FINISHED
      const runFinished: RunFinishedEvent = {
        type: EventType.RUN_FINISHED,
        runId: "run_1",
        threadId: "thread_1",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: runFinished,
        threadId: "thread_1",
      });

      // Normalize timestamps for snapshot stability
      const snapshot = {
        ...state,
        threadMap: {
          thread_1: {
            ...state.threadMap.thread_1,
            thread: {
              ...state.threadMap.thread_1.thread,
              messages: state.threadMap.thread_1.thread.messages.map((m) => ({
                ...m,
                createdAt: "[TIMESTAMP]",
              })),
              createdAt: "[TIMESTAMP]",
              updatedAt: "[TIMESTAMP]",
            },
          },
        },
      };

      expect(snapshot).toMatchSnapshot();
    });

    it("matches snapshot for component streaming flow", () => {
      let state = createTestStreamState("thread_1");

      // Add a message
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      // COMPONENT_START
      const compStart: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.start",
        value: {
          messageId: "msg_1",
          componentId: "comp_1",
          componentName: "WeatherCard",
        },
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: compStart,
        threadId: "thread_1",
      });

      // COMPONENT_PROPS_DELTA - add city
      const propsDelta1: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.props_delta",
        value: {
          componentId: "comp_1",
          operations: [{ op: "add", path: "/city", value: "New York" }],
        },
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: propsDelta1,
        threadId: "thread_1",
      });

      // COMPONENT_PROPS_DELTA - add temperature
      const propsDelta2: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.props_delta",
        value: {
          componentId: "comp_1",
          operations: [{ op: "add", path: "/temperature", value: 72 }],
        },
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: propsDelta2,
        threadId: "thread_1",
      });

      // COMPONENT_END
      const compEnd: CustomEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.end",
        value: { componentId: "comp_1" },
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: compEnd,
        threadId: "thread_1",
      });

      // Normalize timestamps for snapshot stability
      const snapshot = {
        ...state,
        threadMap: {
          thread_1: {
            ...state.threadMap.thread_1,
            thread: {
              ...state.threadMap.thread_1.thread,
              messages: state.threadMap.thread_1.thread.messages.map((m) => ({
                ...m,
                createdAt: "[TIMESTAMP]",
              })),
              createdAt: "[TIMESTAMP]",
              updatedAt: "[TIMESTAMP]",
            },
          },
        },
      };

      expect(snapshot).toMatchSnapshot();
    });

    it("matches snapshot for tool call flow", () => {
      let state = createTestStreamState("thread_1");

      // Add a message with tool_use
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            { type: "tool_use", id: "tool_1", name: "get_weather", input: {} },
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      // TOOL_CALL_ARGS
      const toolArgs: ToolCallArgsEvent = {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool_1",
        delta: '{"city":"San Francisco","units":"fahrenheit"}',
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: toolArgs,
        threadId: "thread_1",
      });

      // TOOL_CALL_END
      const toolEnd: ToolCallEndEvent = {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool_1",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: toolEnd,
        threadId: "thread_1",
      });

      // TOOL_CALL_RESULT
      const toolResult: ToolCallResultEvent = {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tool_1",
        messageId: "msg_1",
        content: "Temperature: 65°F, Sunny",
        role: "tool",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: toolResult,
        threadId: "thread_1",
      });

      // Normalize timestamps for snapshot stability
      const snapshot = {
        ...state,
        threadMap: {
          thread_1: {
            ...state.threadMap.thread_1,
            thread: {
              ...state.threadMap.thread_1.thread,
              messages: state.threadMap.thread_1.thread.messages.map((m) => ({
                ...m,
                createdAt: "[TIMESTAMP]",
              })),
              createdAt: "[TIMESTAMP]",
              updatedAt: "[TIMESTAMP]",
            },
          },
        },
      };

      expect(snapshot).toMatchSnapshot();
    });
  });

  describe("thinking events", () => {
    it("handles THINKING_TEXT_MESSAGE_START event", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];
      state.threadMap.thread_1.streaming.messageId = "msg_1";

      const event: ThinkingTextMessageStartEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_START,
        timestamp: 1704067200000,
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const message = result.threadMap.thread_1.thread.messages[0];
      expect(message.reasoning).toEqual([""]);
      expect(
        result.threadMap.thread_1.streaming.reasoningStartTime,
      ).toBeDefined();
    });

    it("handles THINKING_TEXT_MESSAGE_CONTENT event", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
          reasoning: [""],
        },
      ];
      state.threadMap.thread_1.streaming.messageId = "msg_1";
      state.threadMap.thread_1.streaming.reasoningStartTime = 1704067200000;

      const event: ThinkingTextMessageContentEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
        delta: "Let me think about this...",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const message = result.threadMap.thread_1.thread.messages[0];
      expect(message.reasoning).toEqual(["Let me think about this..."]);
    });

    it("accumulates multiple thinking content deltas", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
          reasoning: ["First part "],
        },
      ];
      state.threadMap.thread_1.streaming.messageId = "msg_1";

      const event: ThinkingTextMessageContentEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
        delta: "second part",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const message = result.threadMap.thread_1.thread.messages[0];
      expect(message.reasoning).toEqual(["First part second part"]);
    });

    it("handles THINKING_TEXT_MESSAGE_END event and calculates duration", () => {
      const startTime = 1704067200000; // Fixed start time
      const endTime = 1704067205000; // 5 seconds later
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
          reasoning: ["Some thinking content"],
        },
      ];
      state.threadMap.thread_1.streaming.messageId = "msg_1";
      state.threadMap.thread_1.streaming.reasoningStartTime = startTime;

      const event: ThinkingTextMessageEndEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_END,
        timestamp: endTime,
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const message = result.threadMap.thread_1.thread.messages[0];
      expect(message.reasoningDurationMS).toBe(5000);
    });

    it("handles multiple thinking chunks", () => {
      let state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];
      state.threadMap.thread_1.streaming.messageId = "msg_1";

      // First thinking chunk
      const start1: ThinkingTextMessageStartEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_START,
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: start1,
        threadId: "thread_1",
      });

      const content1: ThinkingTextMessageContentEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
        delta: "First thought",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: content1,
        threadId: "thread_1",
      });

      const end1: ThinkingTextMessageEndEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_END,
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: end1,
        threadId: "thread_1",
      });

      // Second thinking chunk
      const start2: ThinkingTextMessageStartEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_START,
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: start2,
        threadId: "thread_1",
      });

      const content2: ThinkingTextMessageContentEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
        delta: "Second thought",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: content2,
        threadId: "thread_1",
      });

      const end2: ThinkingTextMessageEndEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_END,
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: end2,
        threadId: "thread_1",
      });

      const message = state.threadMap.thread_1.thread.messages[0];
      expect(message.reasoning).toEqual(["First thought", "Second thought"]);
    });

    it("handles thinking content without explicit start event", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
          // No thinking array yet
        },
      ];
      state.threadMap.thread_1.streaming.messageId = "msg_1";

      const event: ThinkingTextMessageContentEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
        delta: "Implicit start",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const message = result.threadMap.thread_1.thread.messages[0];
      expect(message.reasoning).toEqual(["Implicit start"]);
      expect(
        result.threadMap.thread_1.streaming.reasoningStartTime,
      ).toBeDefined();
    });

    it("creates ephemeral message when no message exists", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [];
      // No messageId set

      const event: ThinkingTextMessageStartEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_START,
        timestamp: 1704067200000,
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      // Should have created an ephemeral assistant message with reasoning
      expect(result.threadMap.thread_1.thread.messages).toHaveLength(1);
      const message = result.threadMap.thread_1.thread.messages[0];
      expect(message.id).toMatch(/^ephemeral_/);
      expect(message.role).toBe("assistant");
      expect(message.reasoning).toEqual([""]);
      expect(result.threadMap.thread_1.streaming.reasoningStartTime).toBe(
        1704067200000,
      );
      expect(result.threadMap.thread_1.streaming.messageId).toBe(message.id);
    });

    it("uses last message when no messageId in streaming state", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];
      // No messageId set in streaming state

      const event: ThinkingTextMessageStartEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_START,
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });

      const message = result.threadMap.thread_1.thread.messages[0];
      expect(message.reasoning).toEqual([""]);
    });

    it("merges ephemeral reasoning message with subsequent TEXT_MESSAGE_START", () => {
      let state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [];

      // Simulate reasoning events arriving before text message
      const thinkingStart: ThinkingTextMessageStartEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_START,
        timestamp: 1704067200000,
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: thinkingStart,
        threadId: "thread_1",
      });

      const thinkingContent: ThinkingTextMessageContentEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
        delta: "Let me think about this...",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: thinkingContent,
        threadId: "thread_1",
      });

      // Verify ephemeral message was created
      expect(state.threadMap.thread_1.thread.messages).toHaveLength(1);
      const ephemeralMessage = state.threadMap.thread_1.thread.messages[0];
      expect(ephemeralMessage.id).toMatch(/^ephemeral_/);
      expect(ephemeralMessage.reasoning).toEqual([
        "Let me think about this...",
      ]);

      // Now TEXT_MESSAGE_START arrives - should merge with ephemeral message
      const textStart: TextMessageStartEvent = {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg_real_123",
        role: "assistant",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: textStart,
        threadId: "thread_1",
      });

      // Should still have only one message (merged)
      expect(state.threadMap.thread_1.thread.messages).toHaveLength(1);
      const mergedMessage = state.threadMap.thread_1.thread.messages[0];

      // The message should have the real ID now
      expect(mergedMessage.id).toBe("msg_real_123");
      // But should preserve the reasoning
      expect(mergedMessage.reasoning).toEqual(["Let me think about this..."]);
      expect(mergedMessage.role).toBe("assistant");
      // Streaming state should track the new message ID
      expect(state.threadMap.thread_1.streaming.messageId).toBe("msg_real_123");
    });

    it("matches snapshot for full thinking flow", () => {
      let state = createTestStreamState("thread_1");

      // Add an assistant message
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];
      state.threadMap.thread_1.streaming.messageId = "msg_1";

      // THINKING_TEXT_MESSAGE_START
      const thinkingStart: ThinkingTextMessageStartEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_START,
        timestamp: 1704067200000,
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: thinkingStart,
        threadId: "thread_1",
      });

      // THINKING_TEXT_MESSAGE_CONTENT
      const thinkingContent: ThinkingTextMessageContentEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
        delta: "Let me analyze this step by step...",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: thinkingContent,
        threadId: "thread_1",
      });

      // THINKING_TEXT_MESSAGE_END
      const thinkingEnd: ThinkingTextMessageEndEvent = {
        type: EventType.THINKING_TEXT_MESSAGE_END,
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: thinkingEnd,
        threadId: "thread_1",
      });

      // TEXT_MESSAGE_CONTENT (actual response after thinking)
      const msgContent: TextMessageContentEvent = {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "msg_1",
        delta: "Based on my analysis, here's what I think...",
      };
      state = streamReducer(state, {
        type: "EVENT",
        event: msgContent,
        threadId: "thread_1",
      });

      // Normalize for snapshot stability
      const snapshot = {
        ...state,
        threadMap: {
          thread_1: {
            ...state.threadMap.thread_1,
            thread: {
              ...state.threadMap.thread_1.thread,
              messages: state.threadMap.thread_1.thread.messages.map((m) => ({
                ...m,
                createdAt: "[TIMESTAMP]",
                // Keep reasoningDurationMS but normalize it for snapshot
                reasoningDurationMS: m.reasoningDurationMS
                  ? "[DURATION]"
                  : undefined,
              })),
              createdAt: "[TIMESTAMP]",
              updatedAt: "[TIMESTAMP]",
            },
            streaming: {
              ...state.threadMap.thread_1.streaming,
              reasoningStartTime: state.threadMap.thread_1.streaming
                .reasoningStartTime
                ? "[TIMESTAMP]"
                : undefined,
            },
          },
        },
      };

      expect(snapshot).toMatchSnapshot();
    });
  });

  describe("LOAD_THREAD_MESSAGES action", () => {
    it("loads messages into empty thread", () => {
      const state = createTestStreamState("thread_1");

      const result = streamReducer(state, {
        type: "LOAD_THREAD_MESSAGES",
        threadId: "thread_1",
        messages: [
          {
            id: "msg_1",
            role: "user",
            content: [{ type: "text", text: "Hello" }],
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          {
            id: "msg_2",
            role: "assistant",
            content: [{ type: "text", text: "Hi there!" }],
            createdAt: "2024-01-01T00:00:01.000Z",
          },
        ],
      });

      expect(result.threadMap.thread_1.thread.messages).toHaveLength(2);
      expect(result.threadMap.thread_1.thread.messages[0].id).toBe("msg_1");
      expect(result.threadMap.thread_1.thread.messages[1].id).toBe("msg_2");
    });

    it("creates thread if it does not exist", () => {
      const state = createInitialState();

      const result = streamReducer(state, {
        type: "LOAD_THREAD_MESSAGES",
        threadId: "new_thread",
        messages: [
          {
            id: "msg_1",
            role: "user",
            content: [{ type: "text", text: "Hello" }],
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      expect(result.threadMap.new_thread).toBeDefined();
      expect(result.threadMap.new_thread.thread.id).toBe("new_thread");
      expect(result.threadMap.new_thread.thread.messages).toHaveLength(1);
    });

    it("deduplicates by message ID, keeping existing messages", () => {
      const state = createTestStreamState("thread_1");
      // Add an existing message
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "user",
          content: [{ type: "text", text: "Existing content" }],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const result = streamReducer(state, {
        type: "LOAD_THREAD_MESSAGES",
        threadId: "thread_1",
        messages: [
          {
            id: "msg_1",
            role: "user",
            content: [{ type: "text", text: "New content" }], // Different content
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          {
            id: "msg_2",
            role: "assistant",
            content: [{ type: "text", text: "Response" }],
            createdAt: "2024-01-01T00:00:01.000Z",
          },
        ],
      });

      expect(result.threadMap.thread_1.thread.messages).toHaveLength(2);
      // Existing message is kept (not replaced)
      expect(result.threadMap.thread_1.thread.messages[0].content[0]).toEqual({
        type: "text",
        text: "Existing content",
      });
      // New message is added
      expect(result.threadMap.thread_1.thread.messages[1].id).toBe("msg_2");
    });

    it("skips merge when streaming and skipIfStreaming is true", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.streaming.status = "streaming";
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "user",
          content: [{ type: "text", text: "Hello" }],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const result = streamReducer(state, {
        type: "LOAD_THREAD_MESSAGES",
        threadId: "thread_1",
        messages: [
          {
            id: "msg_2",
            role: "assistant",
            content: [{ type: "text", text: "Response" }],
            createdAt: "2024-01-01T00:00:01.000Z",
          },
        ],
        skipIfStreaming: true,
      });

      // State should be unchanged
      expect(result).toBe(state);
      expect(result.threadMap.thread_1.thread.messages).toHaveLength(1);
    });

    it("does merge when streaming and skipIfStreaming is false", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.streaming.status = "streaming";
      state.threadMap.thread_1.thread.messages = [];

      const result = streamReducer(state, {
        type: "LOAD_THREAD_MESSAGES",
        threadId: "thread_1",
        messages: [
          {
            id: "msg_1",
            role: "user",
            content: [{ type: "text", text: "Hello" }],
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
        skipIfStreaming: false,
      });

      expect(result.threadMap.thread_1.thread.messages).toHaveLength(1);
    });

    it("sorts messages by createdAt", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_2",
          role: "assistant",
          content: [{ type: "text", text: "Response" }],
          createdAt: "2024-01-01T00:00:02.000Z",
        },
      ];

      const result = streamReducer(state, {
        type: "LOAD_THREAD_MESSAGES",
        threadId: "thread_1",
        messages: [
          {
            id: "msg_1",
            role: "user",
            content: [{ type: "text", text: "Hello" }],
            createdAt: "2024-01-01T00:00:01.000Z",
          },
          {
            id: "msg_3",
            role: "assistant",
            content: [{ type: "text", text: "Goodbye" }],
            createdAt: "2024-01-01T00:00:03.000Z",
          },
        ],
      });

      expect(result.threadMap.thread_1.thread.messages).toHaveLength(3);
      // Should be sorted by createdAt
      expect(result.threadMap.thread_1.thread.messages[0].id).toBe("msg_1");
      expect(result.threadMap.thread_1.thread.messages[1].id).toBe("msg_2");
      expect(result.threadMap.thread_1.thread.messages[2].id).toBe("msg_3");
    });

    it("handles messages without createdAt (places them at the end)", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [];

      const result = streamReducer(state, {
        type: "LOAD_THREAD_MESSAGES",
        threadId: "thread_1",
        messages: [
          {
            id: "msg_no_date",
            role: "assistant",
            content: [{ type: "text", text: "No date" }],
            // No createdAt
          },
          {
            id: "msg_with_date",
            role: "user",
            content: [{ type: "text", text: "Has date" }],
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      expect(result.threadMap.thread_1.thread.messages).toHaveLength(2);
      // Message with date comes first, no date goes to end
      expect(result.threadMap.thread_1.thread.messages[0].id).toBe(
        "msg_with_date",
      );
      expect(result.threadMap.thread_1.thread.messages[1].id).toBe(
        "msg_no_date",
      );
    });

    it("sets streamingState to 'done' on component content blocks without streamingState", () => {
      const state = createTestStreamState("thread_1");

      const result = streamReducer(state, {
        type: "LOAD_THREAD_MESSAGES",
        threadId: "thread_1",
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [
              { type: "text", text: "Here is a component" },
              {
                type: "component",
                id: "comp_1",
                name: "WeatherCard",
                props: { city: "SF", temperature: 72 },
                // No streamingState — simulates API-loaded message
              },
            ],
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      const messages = result.threadMap.thread_1.thread.messages;
      expect(messages).toHaveLength(1);
      const componentBlock = messages[0].content.find(
        (c) => c.type === "component",
      );
      expect(componentBlock).toBeDefined();
      expect(componentBlock!.type).toBe("component");
      expect(
        (componentBlock as { streamingState?: string }).streamingState,
      ).toBe("done");
    });

    it("overwrites non-done streamingState and warns", () => {
      const state = createTestStreamState("thread_1");
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = streamReducer(state, {
        type: "LOAD_THREAD_MESSAGES",
        threadId: "thread_1",
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [
              {
                type: "component",
                id: "comp_1",
                name: "WeatherCard",
                props: { city: "SF" },
                streamingState: "streaming",
              },
            ],
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      const messages = result.threadMap.thread_1.thread.messages;
      const componentBlock = messages[0].content.find(
        (c) => c.type === "component",
      );
      // Always set to "done" for API-loaded messages
      expect(
        (componentBlock as { streamingState?: string }).streamingState,
      ).toBe("done");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unexpected streamingState "streaming"'),
      );

      warnSpy.mockRestore();
    });

    it("handles system role messages from API", () => {
      const state = createTestStreamState("thread_1");

      const result = streamReducer(state, {
        type: "LOAD_THREAD_MESSAGES",
        threadId: "thread_1",
        messages: [
          {
            id: "msg_system",
            role: "system",
            content: [{ type: "text", text: "System prompt" }],
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          {
            id: "msg_user",
            role: "user",
            content: [{ type: "text", text: "Hello" }],
            createdAt: "2024-01-01T00:00:01.000Z",
          },
        ],
      });

      expect(result.threadMap.thread_1.thread.messages).toHaveLength(2);
      expect(result.threadMap.thread_1.thread.messages[0].role).toBe("system");
      expect(result.threadMap.thread_1.thread.messages[1].role).toBe("user");
    });
  });

  describe("UPDATE_THREAD_TITLE action", () => {
    it("updates the title on an existing thread", () => {
      const state = createTestStreamState("thread_1");

      const result = streamReducer(state, {
        type: "UPDATE_THREAD_TITLE",
        threadId: "thread_1",
        title: "My Chat Thread",
      });

      expect(result.threadMap.thread_1.thread.title).toBe("My Chat Thread");
    });

    it("returns unchanged state when thread does not exist", () => {
      const state = createTestStreamState("thread_1");

      const result = streamReducer(state, {
        type: "UPDATE_THREAD_TITLE",
        threadId: "nonexistent_thread",
        title: "My Chat Thread",
      });

      expect(result).toBe(state);
    });

    it("preserves other thread properties when updating title", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "user",
          content: [{ type: "text", text: "Hello" }],
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const result = streamReducer(state, {
        type: "UPDATE_THREAD_TITLE",
        threadId: "thread_1",
        title: "My Chat Thread",
      });

      expect(result.threadMap.thread_1.thread.title).toBe("My Chat Thread");
      expect(result.threadMap.thread_1.thread.messages).toHaveLength(1);
      expect(result.threadMap.thread_1.thread.id).toBe("thread_1");
    });
  });
});
