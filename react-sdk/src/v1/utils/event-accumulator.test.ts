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
  type ToolCallArgsEvent,
  type ToolCallEndEvent,
  type ToolCallResultEvent,
  type ToolCallStartEvent,
} from "@ag-ui/core";
import type {
  ComponentContent,
  ToolUseContent,
} from "@tambo-ai/typescript-sdk/resources/threads/threads";
import {
  createInitialState,
  createInitialThreadState,
  streamReducer,
  type StreamState,
  type ThreadState,
} from "./event-accumulator";
import type { Content } from "../types/message";

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
 * Helper to extract a ComponentContent from a message content array.
 * @param content - Content array from a message
 * @param index - Index of the content item
 * @returns The content as ComponentContent
 */
function asComponentContent(
  content: Content[],
  index: number,
): ComponentContent {
  return content[index] as ComponentContent;
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
  it("creates empty stream state", () => {
    const state = createInitialState();

    expect(state.threadMap).toEqual({});
    expect(state.currentThreadId).toBeNull();
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

    it("logs warning for completely unknown event types", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const state = createTestStreamState("thread_1");
      // Create an event with an unknown type (not in EventType enum)
      const event = {
        type: "TOTALLY_UNKNOWN_EVENT_TYPE",
      };

      const result = streamReducer(state, {
        type: "EVENT",
        event: event as unknown as RunStartedEvent,
        threadId: "thread_1",
      });

      expect(result).toBe(state);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown event type"),
      );

      process.env.NODE_ENV = originalEnv;
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

    it("throws when parentMessageId message not found", () => {
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

      expect(() => {
        streamReducer(state, {
          type: "EVENT",
          event,
          threadId: "thread_1",
        });
      }).toThrow("Message unknown_msg not found for TOOL_CALL_START event");
    });

    it("throws when no messages exist", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [];

      const event: ToolCallStartEvent = {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool_1",
        toolCallName: "get_weather",
        // No parentMessageId, no messages
      };

      expect(() => {
        streamReducer(state, {
          type: "EVENT",
          event,
          threadId: "thread_1",
        });
      }).toThrow("No messages exist for TOOL_CALL_START event");
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
      });
    });

    it("handles tambo.component.props_delta event", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            { type: "component", id: "comp_1", name: "Test", props: {} },
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
        value: { pendingToolCallIds: ["tool_1", "tool_2"] },
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
            { type: "component", id: "comp_1", name: "Counter", props: {} },
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
    });

    it("handles tambo.component.end event", () => {
      const state = createTestStreamState("thread_1");
      state.threadMap.thread_1.thread.messages = [
        {
          id: "msg_1",
          role: "assistant",
          content: [
            { type: "component", id: "comp_1", name: "Test", props: {} },
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

      // component.end doesn't change state currently, just returns unchanged
      expect(result.threadMap.thread_1.thread.messages[0].content[0]).toEqual({
        type: "component",
        id: "comp_1",
        name: "Test",
        props: {},
      });
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
});
