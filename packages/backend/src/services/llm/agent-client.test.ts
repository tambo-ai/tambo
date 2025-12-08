import { BaseEvent, EventType } from "@ag-ui/core";
// Mock the async-adapters module
jest.mock("./async-adapters", () => ({
  runStreamingAgent: jest.fn(),
}));

// Mock the message ID generator to return deterministic, monotonically increasing IDs
let messageIdCounter = 0;
jest.mock("./message-id-generator", () => ({
  generateMessageId: jest.fn(() => `message-${++messageIdCounter}`),
}));

import {
  AgentProviderType,
  ContentPartType,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import { createMockThreadMessage } from "@tambo-ai-cloud/testing";
import OpenAI from "openai";
import { AgentClient, AgentResponse } from "./agent-client";

import { RunAgentResult } from "@ag-ui/client";
import { MastraAgent } from "@ag-ui/mastra";
import { AsyncQueue } from "@tambo-ai-cloud/core";
import { EventHandlerParams, runStreamingAgent } from "./async-adapters";
import { CompleteParams } from "./llm-client";
const mockRunStreamingAgent = jest.mocked(runStreamingAgent);

jest.mock("@mastra/client-js", () => ({
  MastraClient: jest.fn(),
}));
jest.mock("@ag-ui/mastra");

// Helper to create simple mock ThreadMessage for tests
function mockMessage(text: string, id = "msg-1"): ThreadMessage {
  return createMockThreadMessage(id, "thread-1", MessageRole.User, [
    { type: ContentPartType.Text, text },
  ]);
}

describe("AgentClient", () => {
  let agentClient: AgentClient;

  beforeEach(() => {
    jest.clearAllMocks();
    messageIdCounter = 0; // Reset counter for each test

    // Mock the runStreamingAgent to return our mock generator
    mockRunStreamingAgent.mockReturnValue({
      next: jest.fn(),
      return: jest.fn(),
      throw: jest.fn(),
      [Symbol.asyncIterator]: jest.fn(),
    });
  });

  describe("create", () => {
    it("should create a CrewAI agent", async () => {
      const client = await AgentClient.create({
        agentProviderType: AgentProviderType.CREWAI,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      expect(client).toBeInstanceOf(AgentClient);
      expect(client.chainId).toBe("test-chain");
    });

    it("should create a LlamaIndex agent", async () => {
      const client = await AgentClient.create({
        agentProviderType: AgentProviderType.LLAMAINDEX,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      expect(client).toBeInstanceOf(AgentClient);
      expect(client.chainId).toBe("test-chain");
    });

    it("should create a PydanticAI agent", async () => {
      const client = await AgentClient.create({
        agentProviderType: AgentProviderType.PYDANTICAI,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      expect(client).toBeInstanceOf(AgentClient);
      expect(client.chainId).toBe("test-chain");
    });

    it("should create a Mastra agent with name", async () => {
      jest.spyOn(MastraAgent, "getRemoteAgents").mockResolvedValue({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "test-name": {} as any,
      });
      const client = await AgentClient.create({
        agentProviderType: AgentProviderType.MASTRA,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        agentName: "test-name",
        headers: { Authorization: "Bearer test" },
      });

      expect(client).toBeInstanceOf(AgentClient);
      expect(client.chainId).toBe("test-chain");
    });

    it("should throw error for Mastra agent without name", async () => {
      await expect(
        AgentClient.create({
          agentProviderType: AgentProviderType.MASTRA,
          agentUrl: "http://test-url",
          chainId: "test-chain",
          headers: { Authorization: "Bearer test" },
        }),
      ).rejects.toThrow("Agent name is required");
    });

    it("should throw error for unsupported agent type", async () => {
      await expect(
        AgentClient.create({
          agentProviderType: "UNSUPPORTED" as AgentProviderType,
          agentUrl: "http://test-url",
          chainId: "test-chain",
          headers: { Authorization: "Bearer test" },
        }),
      ).rejects.toThrow("Unsupported agent provider type: UNSUPPORTED");
    });
  });

  describe("streamRunAgent", () => {
    let mockGenerator: AsyncIterableIterator<
      EventHandlerParams,
      RunAgentResult
    >;

    beforeEach(async () => {
      agentClient = await AgentClient.create({
        agentProviderType: AgentProviderType.CREWAI,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      // Create a mock generator that we can control
      const events: EventHandlerParams[] = [];

      mockGenerator = {
        async next() {
          if (events.length === 0) {
            return {
              done: true,
              value: { result: null, newMessages: [] },
            } as IteratorReturnResult<RunAgentResult>;
          }
          return { done: false, value: events.shift()! };
        },
        async return() {
          return {
            done: true,
            value: { result: null, newMessages: [] },
          } as IteratorReturnResult<RunAgentResult>;
        },
        async throw() {
          return {
            done: true,
            value: { result: null, newMessages: [] },
          } as IteratorReturnResult<RunAgentResult>;
        },
        [Symbol.asyncIterator]() {
          return this;
        },
        pushEvent: (event: BaseEvent) => {
          events.push({ event } as EventHandlerParams);
        },
        finish: () => {
          // No-op for this mock
        },
      } as AsyncIterableIterator<EventHandlerParams, RunAgentResult> & {
        pushEvent: (event: BaseEvent) => void;
        finish: () => void;
      };

      mockRunStreamingAgent.mockReturnValue(mockGenerator);
    });

    it("should throw error if agent not initialized", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client: AgentClient = new (AgentClient as any)(
        "test-chain",
        undefined,
      );
      const queue = new AsyncQueue<EventHandlerParams>();
      await expect(
        client
          .streamRunAgent(queue, {
            messages: [],
            tools: [],
          })
          .next(),
      ).rejects.toThrow("Agent not initialized");
    });

    it("should convert messages and tools correctly", async () => {
      const toolCallRequest: ToolCallRequest = {
        toolName: "test_tool",
        parameters: [{ parameterName: "param", parameterValue: "value" }],
      };

      const messages: ThreadMessage[] = [
        createMockThreadMessage("msg-1", "thread-1", MessageRole.User, [
          { type: ContentPartType.Text, text: "Hello, world!" },
        ]),
        createMockThreadMessage(
          "msg-2",
          "thread-1",
          MessageRole.Assistant,
          [{ type: ContentPartType.Text, text: "Hi there!" }],
          {
            tool_call_id: "call_123",
            toolCallRequest,
          },
        ),
        createMockThreadMessage(
          "msg-3",
          "thread-1",
          MessageRole.Tool,
          [{ type: ContentPartType.Text, text: "Tool result" }],
          {
            tool_call_id: "call_123",
          },
        ),
      ];

      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: "function",
          function: {
            name: "test_tool",
            description: "A test tool",
            parameters: {
              type: "object",
              properties: {
                param: { type: "string" },
              },
            },
          },
        },
      ];

      // Mock the agent's setMessages method
      const mockSetMessages = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (agentClient as any).aguiAgent = { setMessages: mockSetMessages };

      // Create a mock generator that finishes immediately
      const mockGenerator: AsyncIterableIterator<
        EventHandlerParams,
        RunAgentResult
      > = {
        async next() {
          return {
            done: true,
            value: { result: null, newMessages: [] },
          } as IteratorReturnResult<RunAgentResult>;
        },
        async return() {
          return {
            done: true,
            value: { result: null, newMessages: [] },
          } as IteratorReturnResult<RunAgentResult>;
        },
        async throw() {
          return {
            done: true,
            value: { result: null, newMessages: [] },
          } as IteratorReturnResult<RunAgentResult>;
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      };

      mockRunStreamingAgent.mockReturnValue(mockGenerator);
      const queue = new AsyncQueue<EventHandlerParams>();
      // Start the stream
      const stream = agentClient.streamRunAgent(queue, { messages, tools });

      // Consume the stream to trigger the message conversion
      const responses: AgentResponse[] = [];
      for await (const response of stream) {
        responses.push(response);
      }

      // Verify setMessages was called with converted messages
      expect(mockSetMessages).toHaveBeenCalledWith([
        {
          role: "user",
          content: "Hello, world!",
          id: "msg-1",
        },
        {
          role: "assistant",
          content: "Hi there!",
          id: "msg-2",
          toolCalls: [
            {
              id: "call_123",
              type: "function",
              function: {
                name: "test_tool",
                arguments: '{"param":"value"}',
              },
            },
          ],
        },
        {
          role: "tool",
          content: "Tool result",
          id: "msg-3",
          toolCallId: "call_123",
        },
      ]);

      // Verify runStreamingAgent was called with converted tools
      expect(mockRunStreamingAgent).toHaveBeenCalledWith(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (agentClient as any).aguiAgent,
        queue,
        [
          {
            tools: [
              {
                name: "test_tool",
                description: "A test tool",
                parameters: {
                  type: "object",
                  properties: {
                    param: { type: "string" },
                  },
                },
              },
            ],
          },
        ],
      );
    });

    it("should create deterministic tool call arguments and ignore undefined values", async () => {
      const toolCallRequest: ToolCallRequest = {
        toolName: "test_tool",
        parameters: [
          { parameterName: "b", parameterValue: "second" },
          { parameterName: "a", parameterValue: "first" },
          { parameterName: "c", parameterValue: undefined },
        ],
      };

      const messages: ThreadMessage[] = [
        createMockThreadMessage(
          "msg-1",
          "thread-1",
          MessageRole.Assistant,
          [{ type: ContentPartType.Text, text: "Hi there!" }],
          {
            tool_call_id: "call_123",
            toolCallRequest,
          },
        ),
      ];

      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: "function",
          function: {
            name: "test_tool",
            description: "A test tool",
            parameters: {
              type: "object",
            },
          },
        },
      ];

      const mockSetMessages = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (agentClient as any).aguiAgent = { setMessages: mockSetMessages };

      // Create a mock generator that finishes immediately
      const mockGenerator: AsyncIterableIterator<
        EventHandlerParams,
        RunAgentResult
      > = {
        async next() {
          return {
            done: true,
            value: { result: null, newMessages: [] },
          } as IteratorReturnResult<RunAgentResult>;
        },
        async return() {
          return {
            done: true,
            value: { result: null, newMessages: [] },
          } as IteratorReturnResult<RunAgentResult>;
        },
        async throw() {
          return {
            done: true,
            value: { result: null, newMessages: [] },
          } as IteratorReturnResult<RunAgentResult>;
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      };

      mockRunStreamingAgent.mockReturnValue(mockGenerator);
      const queue = new AsyncQueue<EventHandlerParams>();
      const stream = agentClient.streamRunAgent(queue, { messages, tools });

      // Consume the stream to trigger the message conversion
      for await (const _response of stream) {
        // no-op
      }

      expect(mockSetMessages).toHaveBeenCalledWith([
        {
          role: "assistant",
          content: "Hi there!",
          id: "msg-1",
          toolCalls: [
            {
              id: "call_123",
              type: "function",
              function: {
                name: "test_tool",
                arguments: '{"a":"first","b":"second"}',
              },
            },
          ],
        },
      ]);
    });

    it("should throw when assistant message has toolCallRequest but no tool_call_id", async () => {
      const toolCallRequest: ToolCallRequest = {
        toolName: "test_tool",
        parameters: [{ parameterName: "param", parameterValue: "value" }],
      };

      const messages: ThreadMessage[] = [
        createMockThreadMessage(
          "msg-1",
          "thread-1",
          MessageRole.Assistant,
          [{ type: ContentPartType.Text, text: "Hi there!" }],
          {
            toolCallRequest,
          },
        ),
      ];

      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: "function",
          function: {
            name: "test_tool",
            description: "A test tool",
            parameters: {
              type: "object",
              properties: {
                param: { type: "string" },
              },
            },
          },
        },
      ];

      const queue = new AsyncQueue<EventHandlerParams>();
      const stream = agentClient.streamRunAgent(queue, { messages, tools });

      await expect(stream.next()).rejects.toThrow(
        "Assistant message has toolCallRequest but no tool_call_id",
      );
    });

    it("should throw error for non-function tools", async () => {
      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: "custom",
          custom: {
            name: "test_tool",
          },
        } satisfies OpenAI.Chat.Completions.ChatCompletionCustomTool,
      ];
      const queue = new AsyncQueue<EventHandlerParams>();
      const stream = agentClient.streamRunAgent(queue, { messages: [], tools });

      await expect(stream.next()).rejects.toThrow(
        "Only function tools are supported",
      );
    });
  });

  describe("Event Processing", () => {
    let mockGenerator: AsyncIterableIterator<
      EventHandlerParams,
      RunAgentResult
    > & {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
      pushEvent<T extends BaseEvent>(event: T): void;
      finish: () => void;
    };

    beforeEach(async () => {
      agentClient = await AgentClient.create({
        agentProviderType: AgentProviderType.CREWAI,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      // Create a controllable mock generator
      const events: { event: BaseEvent }[] = [];
      let isFinished = false;
      let eventPromise: Promise<void> | null = null;
      let eventResolve: (() => void) | null = null;

      mockGenerator = {
        async next() {
          if (isFinished) {
            return {
              done: true,
              value: { result: null, newMessages: [] },
            } as IteratorReturnResult<RunAgentResult>;
          }

          // Wait for events to be available
          while (events.length === 0) {
            if (!eventPromise) {
              eventPromise = new Promise<void>((resolve) => {
                eventResolve = resolve;
              });
            }
            await eventPromise;
            eventPromise = null;
            eventResolve = null;
          }

          // After waiting, if finished, return done
          if (isFinished) {
            return {
              done: true,
              value: { result: null, newMessages: [] },
            } as IteratorReturnResult<RunAgentResult>;
          }

          const event = events.shift()!;
          // Don't mark as finished when events are empty - wait for explicit finish() call
          return {
            done: false,
            value: event,
          } as IteratorYieldResult<EventHandlerParams>;
        },
        async return() {
          isFinished = true;
          return {
            done: true,
            value: { result: null, newMessages: [] },
          } as IteratorReturnResult<RunAgentResult>;
        },
        async throw() {
          isFinished = true;
          return {
            done: true,
            value: { result: null, newMessages: [] },
          } as IteratorReturnResult<RunAgentResult>;
        },
        [Symbol.asyncIterator]() {
          return this;
        },
        pushEvent: (event: BaseEvent) => {
          events.push({ event });
          if (eventResolve) {
            eventResolve();
          }
        },
        finish: () => {
          isFinished = true;
          if (eventResolve) {
            eventResolve();
          }
        },
      };

      mockRunStreamingAgent.mockReturnValue(mockGenerator);
    });

    describe("Text Message Events", () => {
      it("should handle text message start/content/end sequence", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Hello")],
          tools: [],
        });

        // Push text message events
        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-1",
          role: "assistant",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-1",
          delta: "Hello",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-1",
          delta: " there!",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_END,
          messageId: "msg-1",
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Message completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });

      it("should handle text message chunk events", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Hello")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-1",
          role: "assistant",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CHUNK,
          messageId: "msg-1",
          delta: "Chunk 1",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CHUNK,
          messageId: "msg-1",
          delta: " Chunk 2",
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Message completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Tool Call Events", () => {
      it("should handle tool call start/args/end sequence", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Use a tool")],
          tools: [
            {
              type: "function",
              function: {
                name: "test_tool",
                description: "A test tool",
                parameters: { type: "object" },
              },
            },
          ],
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "test_tool",
          parentMessageId: "msg-1",
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call-1",
          delta: '{"param": "value"}',
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call-1",
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Tool call completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });

      it("should handle tool call chunk events", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Use a tool")],
          tools: [
            {
              type: "function",
              function: {
                name: "test_tool",
                description: "A test tool",
                parameters: { type: "object" },
              },
            },
          ],
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "test_tool",
          parentMessageId: "msg-1",
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_CHUNK,
          toolCallId: "call-1",
          delta: '{"param": "value',
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_CHUNK,
          toolCallId: "call-1",
          delta: '"}',
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Tool call completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });

      it("should handle tool call result", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Use a tool")],
          tools: [
            {
              type: "function",
              function: {
                name: "test_tool",
                description: "A test tool",
                parameters: { type: "object" },
              },
            },
          ],
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call-1",
          messageId: "tool-msg-1",
          content: "Tool execution result",
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Tool result completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Thinking Events", () => {
      it("should handle thinking start/content/end sequence", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Think about this")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_START,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_START,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
          delta: "Let me think about this...",
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
          delta: " I need to consider multiple factors.",
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_END,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_END,
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Thinking completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });

      it("should handle multiple thinking text messages", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Think step by step")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_START,
        });

        // First thinking message
        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_START,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
          delta: "Step 1: Analyze the problem",
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_END,
        });

        // Second thinking message
        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_START,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
          delta: "Step 2: Consider solutions",
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_END,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_END,
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Multiple thinking completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Run Events", () => {
      it("should handle run started/finished sequence", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Run something")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_STARTED,
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Task completed successfully",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });

      it("should handle run error", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Run something")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_ERROR,
          error: "Something went wrong",
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Run error completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Step Events", () => {
      it("should handle step started/finished sequence", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Execute steps")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.STEP_STARTED,
        });

        mockGenerator.pushEvent({
          type: EventType.STEP_FINISHED,
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Step sequence completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });
    });

    describe("State Events", () => {
      it("should handle state snapshot", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Check state")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.STATE_SNAPSHOT,
          state: { key: "value" },
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "State snapshot completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });

      it("should handle state delta", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Update state")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.STATE_DELTA,
          delta: { newKey: "newValue" },
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "State delta completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Messages Snapshot Events", () => {
      it("should handle messages snapshot with assistant message", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Hello")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.MESSAGES_SNAPSHOT,
          messages: [
            {
              id: "msg-1",
              role: "assistant",
              content: "Hello! How can I help you?",
            },
          ],
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Messages snapshot completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });

      it("should handle messages snapshot with tool message", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Use a tool")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.MESSAGES_SNAPSHOT,
          messages: [
            {
              id: "tool-msg-1",
              role: "tool",
              content: "Tool result",
              toolCallId: "call-1",
            },
          ],
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Tool messages snapshot completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });

      it("should handle messages snapshot with user message", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Hello")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.MESSAGES_SNAPSHOT,
          messages: [
            {
              id: "user-msg-1",
              role: "user",
              content: "Hello, world!",
            },
          ],
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "User messages snapshot completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Complex Conversation Flow", () => {
      it("should handle a complete conversation with assistant message, tool call, tool result, user message, and another assistant message", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Hello")],
          tools: [
            {
              type: "function",
              function: {
                name: "get_weather",
                description: "Get weather information",
                parameters: {
                  type: "object",
                  properties: {
                    location: { type: "string" },
                  },
                },
              },
            },
          ],
        });

        // Assistant message start
        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_START,
          messageId: "assistant-msg-1",
          role: "assistant",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "assistant-msg-1",
          delta: "I can help you with that! Let me check the weather for you.",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_END,
          messageId: "assistant-msg-1",
        });

        // Tool call start
        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-weather-1",
          toolCallName: "get_weather",
          parentMessageId: "assistant-msg-1",
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call-weather-1",
          delta: '{"location": "New York"}',
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call-weather-1",
        });

        // Tool result
        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call-weather-1",
          messageId: "tool-msg-1",
          content: '{"temperature": 72, "condition": "sunny"}',
        });

        // User message
        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_START,
          messageId: "user-msg-1",
          role: "user",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "user-msg-1",
          delta: "Thanks! What about tomorrow?",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_END,
          messageId: "user-msg-1",
        });

        // Another assistant message
        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_START,
          messageId: "assistant-msg-2",
          role: "assistant",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "assistant-msg-2",
          delta: "Tomorrow will be partly cloudy with a high of 75°F.",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_END,
          messageId: "assistant-msg-2",
        });

        // Run finished
        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Conversation completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Error Handling", () => {
      it("should handle missing current message in text content", async () => {
        // Create a new mock generator for this test
        const errorGenerator: AsyncIterableIterator<
          EventHandlerParams,
          RunAgentResult
        > = {
          async next() {
            return {
              done: false,
              value: {
                event: {
                  type: EventType.TEXT_MESSAGE_CONTENT,
                  messageId: "msg-1",
                  delta: "This should fail",
                },
                messages: [],
                state: {},
                agent: {} as any,
                input: {} as any,
              } as EventHandlerParams,
            };
          },
          async return() {
            return {
              done: true,
              value: { result: null, newMessages: [] },
            } as IteratorReturnResult<RunAgentResult>;
          },
          async throw() {
            return {
              done: true,
              value: { result: null, newMessages: [] },
            } as IteratorReturnResult<RunAgentResult>;
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };

        mockRunStreamingAgent.mockReturnValue(errorGenerator);

        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Hello")],
          tools: [],
        });

        const responses: AgentResponse[] = [];
        await expect(async () => {
          for await (const response of stream) {
            responses.push(response);
          }
        }).rejects.toThrow("No current message");
      });

      it("should handle missing tool call in args event", async () => {
        // Create a new mock generator for this test
        const errorGenerator: AsyncIterableIterator<
          EventHandlerParams,
          RunAgentResult
        > = {
          async next() {
            return {
              done: false,
              value: {
                event: {
                  type: EventType.TOOL_CALL_ARGS,
                  toolCallId: "call-1",
                  delta: '{"param": "value"}',
                },
                messages: [],
                state: {},
                agent: {} as any,
                input: {} as any,
              } as EventHandlerParams,
            };
          },
          async return() {
            return {
              done: true,
              value: { result: null, newMessages: [] },
            } as IteratorReturnResult<RunAgentResult>;
          },
          async throw() {
            return {
              done: true,
              value: { result: null, newMessages: [] },
            } as IteratorReturnResult<RunAgentResult>;
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };

        mockRunStreamingAgent.mockReturnValue(errorGenerator);

        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Use a tool")],
          tools: [],
        });

        const responses: AgentResponse[] = [];
        await expect(async () => {
          for await (const response of stream) {
            responses.push(response);
          }
        }).rejects.toThrow("No tool call found");
      });

      it("should handle missing tool call in end event", async () => {
        // Create a new mock generator for this test
        const errorGenerator: AsyncIterableIterator<
          EventHandlerParams,
          RunAgentResult
        > = {
          async next() {
            return {
              done: false,
              value: {
                event: {
                  type: EventType.TOOL_CALL_END,
                  toolCallId: "call-1",
                },
                messages: [],
                state: {},
                agent: {} as any,
                input: {} as any,
              } as EventHandlerParams,
            };
          },
          async return() {
            return {
              done: true,
              value: { result: null, newMessages: [] },
            } as IteratorReturnResult<RunAgentResult>;
          },
          async throw() {
            return {
              done: true,
              value: { result: null, newMessages: [] },
            } as IteratorReturnResult<RunAgentResult>;
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };

        mockRunStreamingAgent.mockReturnValue(errorGenerator);

        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Use a tool")],
          tools: [],
        });

        const responses: AgentResponse[] = [];
        await expect(async () => {
          for await (const response of stream) {
            responses.push(response);
          }
        }).rejects.toThrow("No tool call found");
      });

      it("should handle missing current message in thinking content", async () => {
        // Create a new mock generator for this test
        const errorGenerator: AsyncIterableIterator<
          EventHandlerParams,
          RunAgentResult
        > = {
          async next() {
            return {
              done: false,
              value: {
                event: {
                  type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
                  delta: "This should fail",
                },
                messages: [],
                state: {},
                agent: {} as any,
                input: {} as any,
              } as EventHandlerParams,
            };
          },
          async return() {
            return {
              done: true,
              value: { result: null, newMessages: [] },
            } as IteratorReturnResult<RunAgentResult>;
          },
          async throw() {
            return {
              done: true,
              value: { result: null, newMessages: [] },
            } as IteratorReturnResult<RunAgentResult>;
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };

        mockRunStreamingAgent.mockReturnValue(errorGenerator);

        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Think")],
          tools: [],
        });

        const responses: AgentResponse[] = [];
        await expect(async () => {
          for await (const response of stream) {
            responses.push(response);
          }
        }).rejects.toThrow("No current message");
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty tool calls array", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Hello")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "test_tool",
          parentMessageId: "msg-1",
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call-1",
          delta: '{"param": "value"}',
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Empty tool calls completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });

      it("should handle tool calls with non-function type", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Hello")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "test_tool",
          parentMessageId: "msg-1",
        });

        // Simulate a tool call with unexpected type
        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call-1",
          delta: '{"type": "unexpected"}',
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Non-function tool calls completed",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });

      it("should handle run finished with string result", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Hello")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Simple string result",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });

      it("should handle run finished with object result", async () => {
        const queue = new AsyncQueue<EventHandlerParams>();
        const stream = agentClient.streamRunAgent(queue, {
          messages: [mockMessage("Hello")],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: { status: "success", data: { key: "value" } },
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        mockGenerator.finish();

        expect(responses).toMatchSnapshot();
      });
    });
  });

  describe("nonStreamingComplete", () => {
    it("should throw error if agent not initialized", async () => {
      const client: AgentClient = new (AgentClient as any)(
        "test-chain",
        undefined,
      );

      await expect(
        client.nonStreamingComplete({} as CompleteParams),
      ).rejects.toThrow("Agent not initialized");
    });

    it("should throw not implemented error", async () => {
      agentClient = await AgentClient.create({
        agentProviderType: AgentProviderType.CREWAI,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      await expect(
        agentClient.nonStreamingComplete({} as CompleteParams),
      ).rejects.toThrow("Method not implemented.");
    });
  });
});
