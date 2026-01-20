import {
  AsyncQueue,
  ChatCompletionContentPart,
  MessageRole,
  ThreadMessage,
  ThreadUserMessage,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import {
  AgentClient,
  AgentMessage,
  AgentResponse,
  AgentResponseType,
} from "../llm/agent-client";
import { EventHandlerParams } from "../llm/async-adapters";
import { DecisionStreamItem, runAgentLoop } from "./agent-loop";

// Mock the agent client
const createMockAgentClient = (): AgentClient => {
  return {
    streamRunAgent: jest.fn(),
  } as unknown as AgentClient;
};

// Helper to create mock events
const createMockEvent = (message: AgentMessage): AgentResponse => ({
  type: AgentResponseType.MESSAGE,
  message,
});

// Helper to create base thread message properties
const baseMessageProps = {
  threadId: "test-thread",
  componentState: {},
  createdAt: new Date("2024-01-01T00:00:00Z"),
};

// Helper to create user messages
const createUserMessage = (
  id: string,
  content: ChatCompletionContentPart[],
): ThreadUserMessage => ({
  ...baseMessageProps,
  id,
  role: MessageRole.User,
  content,
});

// Helper to create mock tools
const createMockTools = (): OpenAI.Chat.Completions.ChatCompletionTool[] => [
  {
    type: "function",
    function: {
      name: "test_tool",
      description: "A test tool",
      parameters: {
        type: "object",
        properties: {
          param1: { type: "string" },
          param2: { type: "number" },
        },
      },
    },
  },
];

describe("runAgentLoop", () => {
  let mockAgentClient: AgentClient;
  let mockStream: AsyncIterableIterator<AgentResponse>;

  beforeEach(() => {
    mockAgentClient = createMockAgentClient();
    mockStream = {
      [Symbol.asyncIterator]: jest.fn(),
    } as unknown as AsyncIterableIterator<AgentResponse>;
    jest.mocked(mockAgentClient.streamRunAgent).mockReturnValue(mockStream);
  });

  describe("message event sequences", () => {
    it("should handle complete assistant message sequence", async () => {
      const messages: ThreadMessage[] = [
        createUserMessage("user-1", [
          { type: "text", text: "Hello, how are you?" },
        ]),
      ];

      const events = [
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: undefined,
          reasoning: ["I need to respond to the user's greeting"],
        }),
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: "Hello! I'm doing well, thank you for asking. ",
          reasoning: ["I should be friendly and respond to their greeting"],
        }),
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content:
            "Hello! I'm doing well, thank you for asking. How can I help you today?",
          reasoning: ["I should also offer to help them"],
        }),
      ];

      // Mock the async iterator
      let eventIndex = 0;
      jest.mocked(mockStream[Symbol.asyncIterator]).mockReturnValue({
        next: async () => {
          if (eventIndex < events.length) {
            return { value: events[eventIndex++], done: false };
          }
          return { done: true, value: undefined };
        },
      } as AsyncIterableIterator<AgentResponse>);

      const results: DecisionStreamItem[] = [];
      const queue = new AsyncQueue<EventHandlerParams>();
      for await (const result of runAgentLoop(
        mockAgentClient,
        queue,
        messages,
        createMockTools(),
        {},
      )) {
        results.push(result);
      }

      expect(results).toMatchSnapshot();
    });

    it("should handle user message sequence", async () => {
      const messages: ThreadMessage[] = [];

      const events = [
        createMockEvent({
          id: "user-1",
          role: "user",
          content: "",
          reasoning: [],
        }),
        createMockEvent({
          id: "user-1",
          role: "user",
          content: "What's the weather like?",
          reasoning: [],
        }),
      ];

      let eventIndex = 0;
      jest.mocked(mockStream[Symbol.asyncIterator]).mockReturnValue({
        next: async () => {
          if (eventIndex < events.length) {
            return { value: events[eventIndex++], done: false };
          }
          return { done: true, value: undefined };
        },
      } as AsyncIterableIterator<AgentResponse>);

      const results: DecisionStreamItem[] = [];
      const queue = new AsyncQueue<EventHandlerParams>();
      for await (const result of runAgentLoop(
        mockAgentClient,
        queue,
        messages,
        createMockTools(),
        {},
      )) {
        results.push(result);
      }

      expect(results).toMatchSnapshot();
    });
  });

  describe("tool call event sequences", () => {
    it("should handle complete tool call sequence", async () => {
      const messages: ThreadMessage[] = [];

      const events = [
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: "I'll help you with that.",
          reasoning: ["I should use a tool to get the information"],
        }),
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: "I'll help you with that.",
          toolCalls: [
            {
              id: "call_123",
              type: "function" as const,
              function: {
                name: "test_tool",
                arguments: "",
              },
            },
          ],
          reasoning: ["I need to call the test_tool"],
        }),
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: "I'll help you with that.",
          toolCalls: [
            {
              id: "call_123",
              type: "function" as const,
              function: {
                name: "test_tool",
                arguments: '{"param1": "value1", "param2": 42}',
              },
            },
          ],
          reasoning: ["I've prepared the tool call with parameters"],
        }),
      ];

      let eventIndex = 0;
      jest.mocked(mockStream[Symbol.asyncIterator]).mockReturnValue({
        next: async () => {
          if (eventIndex < events.length) {
            return { value: events[eventIndex++], done: false };
          }
          return { done: true, value: undefined };
        },
      } as AsyncIterableIterator<AgentResponse>);

      const results: DecisionStreamItem[] = [];
      const queue = new AsyncQueue<EventHandlerParams>();
      for await (const result of runAgentLoop(
        mockAgentClient,
        queue,
        messages,
        createMockTools(),
        {},
      )) {
        results.push(result);
      }

      expect(results).toMatchSnapshot();
    });

    it("should handle tool call with invalid JSON arguments", async () => {
      const messages: ThreadMessage[] = [];

      const events = [
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: "I'll call a tool.",
          toolCalls: [
            {
              id: "call_123",
              type: "function" as const,
              function: {
                name: "test_tool",
                arguments: '{"invalid": json}', // Invalid JSON
              },
            },
          ],
          reasoning: ["I need to call the test_tool"],
        }),
      ];

      let eventIndex = 0;
      jest.mocked(mockStream[Symbol.asyncIterator]).mockReturnValue({
        next: async () => {
          if (eventIndex < events.length) {
            return { value: events[eventIndex++], done: false };
          }
          return { done: true, value: undefined };
        },
      } as AsyncIterableIterator<AgentResponse>);

      // Mock console.warn to avoid test output
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const results: DecisionStreamItem[] = [];
      const queue = new AsyncQueue<EventHandlerParams>();
      for await (const result of runAgentLoop(
        mockAgentClient,
        queue,
        messages,
        createMockTools(),
        {},
      )) {
        results.push(result);
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error parsing tool call arguments"),
        expect.any(Error),
        '{"invalid": json}',
      );
      expect(results).toMatchSnapshot();

      consoleSpy.mockRestore();
    });

    it("should handle tool result message", async () => {
      const messages: ThreadMessage[] = [];

      const events = [
        createMockEvent({
          id: "tool-1",
          role: "tool",
          content: "Tool execution result",
          toolCallId: "call_123",
          reasoning: [],
        }),
      ];

      let eventIndex = 0;
      jest.mocked(mockStream[Symbol.asyncIterator]).mockReturnValue({
        next: async () => {
          if (eventIndex < events.length) {
            return { value: events[eventIndex++], done: false };
          }
          return { done: true, value: undefined };
        },
      } as AsyncIterableIterator<AgentResponse>);

      const results: DecisionStreamItem[] = [];
      const queue = new AsyncQueue<EventHandlerParams>();
      for await (const result of runAgentLoop(
        mockAgentClient,
        queue,
        messages,
        createMockTools(),
        {},
      )) {
        results.push(result);
      }

      expect(results).toMatchSnapshot();
    });
  });

  describe("reasoning sequences", () => {
    it("should handle assistant message with reasoning", async () => {
      const messages: ThreadMessage[] = [];

      const events = [
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: undefined,
          reasoning: [
            "The user is asking about the weather",
            "I should check the current weather conditions",
            "I'll need to use a weather tool",
          ],
        }),
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: "Let me check the weather for you.",
          reasoning: [
            "The user is asking about the weather",
            "I should check the current weather conditions",
            "I'll need to use a weather tool",
            "I should let them know I'm looking it up",
          ],
        }),
      ];

      let eventIndex = 0;
      jest.mocked(mockStream[Symbol.asyncIterator]).mockReturnValue({
        next: async () => {
          if (eventIndex < events.length) {
            return { value: events[eventIndex++], done: false };
          }
          return { done: true, value: undefined };
        },
      } as AsyncIterableIterator<AgentResponse>);

      const results: DecisionStreamItem[] = [];
      const queue = new AsyncQueue<EventHandlerParams>();
      for await (const result of runAgentLoop(
        mockAgentClient,
        queue,
        messages,
        createMockTools(),
        {},
      )) {
        results.push(result);
      }

      expect(results).toMatchSnapshot();
    });

    it("should handle reasoning without content", async () => {
      const messages: ThreadMessage[] = [];

      const events = [
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: undefined,
          reasoning: [
            "I need to think about this problem",
            "This is a complex question that requires analysis",
            "Let me break it down step by step",
          ],
        }),
      ];

      let eventIndex = 0;
      jest.mocked(mockStream[Symbol.asyncIterator]).mockReturnValue({
        next: async () => {
          if (eventIndex < events.length) {
            return { value: events[eventIndex++], done: false };
          }
          return { done: true, value: undefined };
        },
      } as AsyncIterableIterator<AgentResponse>);

      const results: DecisionStreamItem[] = [];
      const queue = new AsyncQueue<EventHandlerParams>();
      for await (const result of runAgentLoop(
        mockAgentClient,
        queue,
        messages,
        createMockTools(),
        {},
      )) {
        results.push(result);
      }

      expect(results).toMatchSnapshot();
    });
  });

  describe("complete conversation flow", () => {
    it("should handle full conversation with assistant, tool call, tool result, and follow-up", async () => {
      const messages: ThreadMessage[] = [
        createUserMessage("user-1", [{ type: "text", text: "What's 2 + 2?" }]),
      ];

      const events = [
        // First assistant message
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: undefined,
          reasoning: [
            "The user is asking a math question",
            "I should use a calculator tool",
          ],
        }),
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: "I'll calculate that for you.",
          reasoning: [
            "The user is asking a math question",
            "I should use a calculator tool",
          ],
        }),

        // Tool call
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: "I'll calculate that for you.",
          toolCalls: [
            {
              id: "call_calc_1",
              type: "function" as const,
              function: {
                name: "calculator",
                arguments: '{"expression": "2 + 2"}',
              },
            },
          ],
          reasoning: ["I need to call the calculator tool with the expression"],
        }),

        // Tool result
        createMockEvent({
          id: "tool-1",
          role: "tool",
          content: "4",
          toolCallId: "call_calc_1",
          reasoning: [],
        }),

        // User follow-up
        createMockEvent({
          id: "user-2",
          role: "user",
          content: "What about 5 * 3?",
          reasoning: [],
        }),

        // Second assistant message
        createMockEvent({
          id: "assistant-2",
          role: "assistant",
          content: undefined,
          reasoning: [
            "The user is asking another math question",
            "I should use the calculator tool again",
          ],
        }),
        createMockEvent({
          id: "assistant-2",
          role: "assistant",
          content: "I'll calculate that too.",
          reasoning: [
            "The user is asking another math question",
            "I should use the calculator tool again",
          ],
        }),
        createMockEvent({
          id: "assistant-2",
          role: "assistant",
          content: "I'll calculate that too.",
          toolCalls: [
            {
              id: "call_calc_2",
              type: "function" as const,
              function: {
                name: "calculator",
                arguments: '{"expression": "5 * 3"}',
              },
            },
          ],
          reasoning: [
            "I need to call the calculator tool with the new expression",
          ],
        }),
        createMockEvent({
          id: "assistant-2",
          role: "assistant",
          content: "I'll calculate that too.",
          toolCalls: [
            {
              id: "call_calc_2",
              type: "function" as const,
              function: {
                name: "calculator",
                arguments: '{"expression": "5 * 3"}',
              },
            },
          ],
          reasoning: [
            "I need to call the calculator tool with the new expression",
          ],
        }),
      ];

      let eventIndex = 0;
      jest.mocked(mockStream[Symbol.asyncIterator]).mockReturnValue({
        next: async () => {
          if (eventIndex < events.length) {
            return { value: events[eventIndex++], done: false };
          }
          return { done: true, value: undefined };
        },
      } as AsyncIterableIterator<AgentResponse>);

      const results: DecisionStreamItem[] = [];
      const queue = new AsyncQueue<EventHandlerParams>();
      for await (const result of runAgentLoop(
        mockAgentClient,
        queue,
        messages,
        createMockTools(),
        {},
      )) {
        results.push(result);
      }

      expect(results).toMatchSnapshot();
    });
  });

  describe("edge cases", () => {
    it("should handle empty message content", async () => {
      const messages: ThreadMessage[] = [];

      const events = [
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: "",
          reasoning: [],
        }),
      ];

      let eventIndex = 0;
      jest.mocked(mockStream[Symbol.asyncIterator]).mockReturnValue({
        next: async () => {
          if (eventIndex < events.length) {
            return { value: events[eventIndex++], done: false };
          }
          return { done: true, value: undefined };
        },
      } as AsyncIterableIterator<AgentResponse>);

      const results: DecisionStreamItem[] = [];
      const queue = new AsyncQueue<EventHandlerParams>();
      for await (const result of runAgentLoop(
        mockAgentClient,
        queue,
        messages,
        createMockTools(),
        {},
      )) {
        results.push(result);
      }

      expect(results).toMatchSnapshot();
    });

    it("should handle assistant message without tool calls", async () => {
      const messages: ThreadMessage[] = [];

      const events = [
        createMockEvent({
          id: "assistant-1",
          role: "assistant",
          content: "This is a simple response.",
          reasoning: [],
        }),
      ];

      let eventIndex = 0;
      jest.mocked(mockStream[Symbol.asyncIterator]).mockReturnValue({
        next: async () => {
          if (eventIndex < events.length) {
            return { value: events[eventIndex++], done: false };
          }
          return { done: true, value: undefined };
        },
      } as AsyncIterableIterator<AgentResponse>);

      const results: DecisionStreamItem[] = [];
      const queue = new AsyncQueue<EventHandlerParams>();
      for await (const result of runAgentLoop(
        mockAgentClient,
        queue,
        messages,
        createMockTools(),
        {},
      )) {
        results.push(result);
      }

      expect(results).toMatchSnapshot();
    });

    it("should handle system message", async () => {
      const messages: ThreadMessage[] = [];

      const events = [
        createMockEvent({
          id: "system-1",
          role: "system",
          content: "You are a helpful assistant.",
          reasoning: [],
        }),
      ];

      let eventIndex = 0;
      jest.mocked(mockStream[Symbol.asyncIterator]).mockReturnValue({
        next: async () => {
          if (eventIndex < events.length) {
            return { value: events[eventIndex++], done: false };
          }
          return { done: true, value: undefined };
        },
      } as AsyncIterableIterator<AgentResponse>);

      const results: DecisionStreamItem[] = [];
      const queue = new AsyncQueue<EventHandlerParams>();
      for await (const result of runAgentLoop(
        mockAgentClient,
        queue,
        messages,
        createMockTools(),
        {},
      )) {
        results.push(result);
      }

      expect(results).toMatchSnapshot();
    });
  });
});
