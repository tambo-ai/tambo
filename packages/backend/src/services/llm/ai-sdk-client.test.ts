import { EventType } from "@ag-ui/core";
import { AISdkClient } from "./ai-sdk-client";

// Mock the message ID generator
let messageIdCounter = 0;
jest.mock("./message-id-generator", () => ({
  generateMessageId: jest.fn(() => `message-${++messageIdCounter}`),
}));

// Mock the langfuse config
jest.mock("../../config/langfuse.config", () => ({
  createLangfuseTelemetryConfig: jest.fn(() => undefined),
}));

// Mock AI SDK provider factories for mergeProviderSkills tests
const mockShellTool = { type: "provider-defined", id: "shell" };
const mockCodeExecutionTool = {
  type: "provider-defined",
  id: "code_execution",
};
const mockResponsesModel = { modelId: "gpt-4-responses", provider: "openai" };

jest.mock("@ai-sdk/openai", () => ({
  createOpenAI: jest.fn(() => {
    const provider = () => ({ modelId: "gpt-4", provider: "openai" });
    provider.responses = jest.fn(() => mockResponsesModel);
    provider.tools = {
      shell: jest.fn(() => mockShellTool),
    };
    return provider;
  }),
}));

jest.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: jest.fn(() => {
    const provider = () => ({
      modelId: "claude-sonnet",
      provider: "anthropic",
    });
    provider.tools = {
      codeExecution_20260120: jest.fn(() => mockCodeExecutionTool),
    };
    return provider;
  }),
}));

// Type for the delta events from AI SDK's fullStream
type StreamDelta =
  | { type: "tool-input-start"; id: string; toolName: string }
  | { type: "tool-input-delta"; id: string; delta: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; args: unknown }
  | {
      type: "tool-result";
      toolCallId: string;
      result: unknown;
      providerExecuted: boolean;
    }
  | { type: "text-start" }
  | { type: "text-delta"; text: string }
  | { type: "text-end" }
  | { type: "finish" };

/**
 * Creates a mock TextStreamResponse that yields the given deltas
 */
function createMockStreamResponse(deltas: StreamDelta[]) {
  return {
    fullStream: (async function* () {
      for (const delta of deltas) {
        yield delta;
      }
    })(),
  };
}

describe("AISdkClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    messageIdCounter = 0;
  });

  describe("handleStreamingResponse - tool call streaming", () => {
    it("should yield chunks with tool call info as arguments stream in", async () => {
      // Create a client instance - we'll access the private method via prototype
      const client = new AISdkClient(
        "test-api-key",
        "gpt-4",
        "openai",
        "test-chain",
        "test-user",
      );

      // Mock stream: tool-input-start -> tool-input-delta (x3) -> tool-call
      const mockDeltas: StreamDelta[] = [
        { type: "tool-input-start", id: "call-123", toolName: "get_weather" },
        { type: "tool-input-delta", id: "call-123", delta: '{"loc' },
        { type: "tool-input-delta", id: "call-123", delta: 'ation":' },
        { type: "tool-input-delta", id: "call-123", delta: '"NYC"}' },
        {
          type: "tool-call",
          toolCallId: "call-123",
          toolName: "get_weather",
          args: { location: "NYC" },
        },
      ];

      const mockStream = createMockStreamResponse(mockDeltas);

      // Access the private method - this is a bit hacky but necessary for unit testing
      const handleStreamingResponse = (
        client as any
      ).handleStreamingResponse.bind(client);

      // Collect all yielded chunks
      const chunks = [];
      for await (const chunk of handleStreamingResponse(mockStream)) {
        chunks.push(chunk);
      }

      // Assert: we got a chunk for each delta (not buffered until end)
      expect(chunks.length).toBe(5);

      // Assert: after tool-input-start, we have the tool name but no arguments yet
      const afterStartChunk = chunks[0];
      expect(afterStartChunk.llmResponse.message?.tool_calls).toBeUndefined(); // No tool call yet - arguments is empty string

      // Assert: after first tool-input-delta, we have partial arguments
      const afterFirstDelta = chunks[1];
      expect(
        afterFirstDelta.llmResponse.message?.tool_calls?.[0]?.function.name,
      ).toBe("get_weather");
      expect(
        afterFirstDelta.llmResponse.message?.tool_calls?.[0]?.function
          .arguments,
      ).toBe('{"loc');

      // Assert: arguments accumulate with each delta
      const afterSecondDelta = chunks[2];
      expect(
        afterSecondDelta.llmResponse.message?.tool_calls?.[0]?.function
          .arguments,
      ).toBe('{"location":');

      const afterThirdDelta = chunks[3];
      expect(
        afterThirdDelta.llmResponse.message?.tool_calls?.[0]?.function
          .arguments,
      ).toBe('{"location":"NYC"}');

      // Assert: final chunk (after tool-call event) has the real ID
      const finalChunk = chunks[4];
      expect(
        finalChunk.llmResponse.message?.tool_calls?.[0]?.function.name,
      ).toBe("get_weather");
      expect(
        finalChunk.llmResponse.message?.tool_calls?.[0]?.function.arguments,
      ).toBe('{"location":"NYC"}');
      expect(finalChunk.llmResponse.message?.tool_calls?.[0]?.id).toBe(
        "call-123",
      );
    });

    it("should stream text content and tool calls in sequence", async () => {
      const client = new AISdkClient(
        "test-api-key",
        "gpt-4",
        "openai",
        "test-chain",
        "test-user",
      );

      // Mock stream: text message followed by tool call
      const mockDeltas: StreamDelta[] = [
        { type: "text-start" },
        { type: "text-delta", text: "Let me check " },
        { type: "text-delta", text: "the weather." },
        { type: "text-end" },
        { type: "tool-input-start", id: "call-456", toolName: "get_weather" },
        { type: "tool-input-delta", id: "call-456", delta: '{"city":"SF"}' },
        {
          type: "tool-call",
          toolCallId: "call-456",
          toolName: "get_weather",
          args: { city: "SF" },
        },
      ];

      const mockStream = createMockStreamResponse(mockDeltas);
      const handleStreamingResponse = (
        client as any
      ).handleStreamingResponse.bind(client);

      const chunks = [];
      for await (const chunk of handleStreamingResponse(mockStream)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(7);

      // Text content accumulates
      expect(chunks[1].llmResponse.message?.content).toBe("Let me check ");
      expect(chunks[2].llmResponse.message?.content).toBe(
        "Let me check the weather.",
      );

      // Tool call appears after text
      const toolCallChunk = chunks[5];
      expect(
        toolCallChunk.llmResponse.message?.tool_calls?.[0]?.function.name,
      ).toBe("get_weather");
      expect(
        toolCallChunk.llmResponse.message?.tool_calls?.[0]?.function.arguments,
      ).toBe('{"city":"SF"}');
    });

    it("should not buffer tool call chunks - each delta yields immediately", async () => {
      const client = new AISdkClient(
        "test-api-key",
        "gpt-4",
        "openai",
        "test-chain",
        "test-user",
      );

      // Track when each chunk is yielded
      const yieldTimes: number[] = [];
      let deltaIndex = 0;

      const mockDeltas: StreamDelta[] = [
        { type: "tool-input-start", id: "call-789", toolName: "test_tool" },
        { type: "tool-input-delta", id: "call-789", delta: '{"a":' },
        { type: "tool-input-delta", id: "call-789", delta: '"b"}' },
        {
          type: "tool-call",
          toolCallId: "call-789",
          toolName: "test_tool",
          args: { a: "b" },
        },
      ];

      // Create a stream that tracks when deltas are consumed
      const mockStream = {
        fullStream: (async function* () {
          for (const delta of mockDeltas) {
            deltaIndex++;
            yield delta;
          }
        })(),
      };

      const handleStreamingResponse = (
        client as any
      ).handleStreamingResponse.bind(client);

      let chunkCount = 0;
      for await (const _chunk of handleStreamingResponse(mockStream)) {
        chunkCount++;
        yieldTimes.push(deltaIndex);
      }

      // Each delta should yield a chunk - no buffering
      expect(chunkCount).toBe(4);
      // Chunks should be yielded as deltas arrive (deltaIndex matches chunk index)
      expect(yieldTimes).toEqual([1, 2, 3, 4]);
    });

    it("should emit TOOL_CALL AG-UI events incrementally for V1 streaming", async () => {
      const client = new AISdkClient(
        "test-api-key",
        "gpt-4",
        "openai",
        "test-chain",
        "test-user",
      );
      const mockDeltas: StreamDelta[] = [
        { type: "tool-input-start", id: "call-123", toolName: "get_weather" },
        { type: "tool-input-delta", id: "call-123", delta: '{"loc' },
        { type: "tool-input-delta", id: "call-123", delta: 'ation":"NYC"}' },
        {
          type: "tool-call",
          toolCallId: "call-123",
          toolName: "get_weather",
          args: { location: "NYC" },
        },
      ];

      const mockStream = createMockStreamResponse(mockDeltas);
      const handleStreamingResponse = (
        client as any
      ).handleStreamingResponse.bind(client);

      const chunks = [];
      for await (const chunk of handleStreamingResponse(mockStream)) {
        chunks.push(chunk);
      }

      // tool-input-start → TOOL_CALL_START emitted immediately
      expect(chunks[0].aguiEvents).toEqual([
        expect.objectContaining({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-123",
          toolCallName: "get_weather",
        }),
      ]);

      // Each tool-input-delta → TOOL_CALL_ARGS emitted immediately
      expect(chunks[1].aguiEvents).toEqual([
        expect.objectContaining({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call-123",
          delta: '{"loc',
        }),
      ]);
      expect(chunks[2].aguiEvents).toEqual([
        expect.objectContaining({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call-123",
          delta: 'ation":"NYC"}',
        }),
      ]);

      // tool-call → only TOOL_CALL_END (START and ARGS already emitted)
      expect(chunks[3].aguiEvents).toEqual([
        expect.objectContaining({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call-123",
        }),
      ]);
    });
  });

  describe("mergeProviderSkills", () => {
    function callMergeProviderSkills(
      client: AISdkClient,
      config: Record<string, unknown>,
      skillConfig: import("@tambo-ai-cloud/core").ProviderSkillConfig,
      providerKey: string,
    ) {
      return (client as any).mergeProviderSkills(
        config,
        skillConfig,
        providerKey,
      );
    }

    it("adds shell tool and switches to responses model for OpenAI", () => {
      const client = new AISdkClient(
        "test-api-key",
        "gpt-4",
        "openai",
        "test-chain",
        "test-user",
      );

      const baseConfig = {
        model: { modelId: "gpt-4" },
        messages: [],
        tools: { existing_tool: { type: "function" } },
        providerOptions: { openai: { parallelToolCalls: false } },
      };

      const skillConfig = {
        providerName: "openai",
        skills: [
          { skillId: "sk-abc", version: "1" },
          { skillId: "sk-def", version: "2" },
        ],
      };

      const result = callMergeProviderSkills(
        client,
        baseConfig,
        skillConfig,
        "openai",
      );

      // Should switch to responses model
      expect(result.model).toBe(mockResponsesModel);

      // Should add shell tool while preserving existing tools
      expect(result.tools.existing_tool).toEqual({ type: "function" });
      expect(result.tools.shell).toBe(mockShellTool);

      // Should preserve existing providerOptions
      expect(result.providerOptions.openai).toEqual({
        parallelToolCalls: false,
      });
    });

    it("adds code execution tool and container skills for Anthropic", () => {
      const client = new AISdkClient(
        "test-api-key",
        "claude-sonnet",
        "anthropic",
        "test-chain",
        "test-user",
      );

      const baseConfig = {
        model: { modelId: "claude-sonnet" },
        messages: [],
        tools: { existing_tool: { type: "function" } },
        providerOptions: {
          anthropic: { cacheControl: true },
        },
      };

      const skillConfig = {
        providerName: "anthropic",
        skills: [{ skillId: "sk-xyz", version: "3" }],
      };

      const result = callMergeProviderSkills(
        client,
        baseConfig,
        skillConfig,
        "anthropic",
      );

      // Should NOT change the model
      expect(result.model).toEqual({ modelId: "claude-sonnet" });

      // Should add code_execution tool while preserving existing
      expect(result.tools.existing_tool).toEqual({ type: "function" });
      expect(result.tools.code_execution).toBe(mockCodeExecutionTool);

      // Should add container.skills under anthropic providerOptions
      expect(result.providerOptions.anthropic.container).toEqual({
        skills: [{ type: "custom", skillId: "sk-xyz", version: "3" }],
      });

      // Should preserve existing anthropic providerOptions
      expect(result.providerOptions.anthropic.cacheControl).toBe(true);
    });

    it("returns config unchanged for unsupported provider", () => {
      const client = new AISdkClient(
        "test-api-key",
        "mistral-large",
        "mistral",
        "test-chain",
        "test-user",
      );

      const baseConfig = {
        model: { modelId: "mistral-large" },
        messages: [],
        tools: {},
      };

      const skillConfig = {
        providerName: "mistral",
        skills: [{ skillId: "sk-nope", version: "1" }],
      };

      const result = callMergeProviderSkills(
        client,
        baseConfig,
        skillConfig,
        "mistral",
      );

      expect(result).toBe(baseConfig);
    });

    it("works with empty existing tools for OpenAI", () => {
      const client = new AISdkClient(
        "test-api-key",
        "gpt-4",
        "openai",
        "test-chain",
        "test-user",
      );

      const baseConfig = {
        model: { modelId: "gpt-4" },
        messages: [],
        tools: undefined,
        providerOptions: {},
      };

      const skillConfig = {
        providerName: "openai",
        skills: [{ skillId: "sk-solo", version: "1" }],
      };

      const result = callMergeProviderSkills(
        client,
        baseConfig,
        skillConfig,
        "openai",
      );

      expect(result.tools.shell).toBe(mockShellTool);
      expect(result.model).toBe(mockResponsesModel);
    });

    it("works with no existing providerOptions for Anthropic", () => {
      const client = new AISdkClient(
        "test-api-key",
        "claude-sonnet",
        "anthropic",
        "test-chain",
        "test-user",
      );

      const baseConfig = {
        model: { modelId: "claude-sonnet" },
        messages: [],
        tools: {},
        providerOptions: {},
      };

      const skillConfig = {
        providerName: "anthropic",
        skills: [{ skillId: "sk-one", version: "1" }],
      };

      const result = callMergeProviderSkills(
        client,
        baseConfig,
        skillConfig,
        "anthropic",
      );

      expect(result.providerOptions.anthropic.container.skills).toEqual([
        { type: "custom", skillId: "sk-one", version: "1" },
      ]);
    });

    it("does not mutate the original config", () => {
      const client = new AISdkClient(
        "test-api-key",
        "gpt-4",
        "openai",
        "test-chain",
        "test-user",
      );

      const baseConfig = {
        model: { modelId: "gpt-4" },
        messages: [],
        tools: { my_tool: { type: "function" } },
        providerOptions: { openai: { parallelToolCalls: false } },
      };

      const originalTools = { ...baseConfig.tools };
      const originalProviderOptions = { ...baseConfig.providerOptions };

      callMergeProviderSkills(
        client,
        baseConfig,
        {
          providerName: "openai",
          skills: [{ skillId: "sk-abc", version: "1" }],
        },
        "openai",
      );

      // Original config should not be mutated
      expect(baseConfig.tools).toEqual(originalTools);
      expect(baseConfig.providerOptions).toEqual(originalProviderOptions);
    });
  });

  describe("handleStreamingResponse - skill tool suppression", () => {
    function createClient() {
      return new AISdkClient(
        "test-api-key",
        "claude-sonnet",
        "anthropic",
        "test-chain",
        "test-user",
      );
    }

    function callHandleStreamingResponse(
      client: AISdkClient,
      mockStream: { fullStream: AsyncIterable<StreamDelta> },
      hasProviderSkills: boolean,
    ) {
      return (client as any).handleStreamingResponse.call(
        client,
        mockStream,
        hasProviderSkills,
      );
    }

    it("suppresses skill tool calls when provider skills are configured", async () => {
      const client = createClient();
      const mockDeltas: StreamDelta[] = [
        { type: "text-start" },
        { type: "text-delta", text: "Using skill..." },
        { type: "text-end" },
        {
          type: "tool-input-start",
          id: "call-skill",
          toolName: "code_execution",
        },
        {
          type: "tool-input-delta",
          id: "call-skill",
          delta: '{"path":"/skills/foo/SKILL.md"}',
        },
        {
          type: "tool-call",
          toolCallId: "call-skill",
          toolName: "code_execution",
          args: {},
        },
        {
          type: "tool-result",
          toolCallId: "call-skill",
          result: "ok",
          providerExecuted: true,
        },
        { type: "text-start" },
        { type: "text-delta", text: "Done." },
        { type: "text-end" },
      ];

      const mockStream = createMockStreamResponse(mockDeltas);
      const chunks = [];
      for await (const chunk of callHandleStreamingResponse(
        client,
        mockStream,
        true,
      )) {
        chunks.push(chunk);
      }

      // No chunk should have tool_calls set
      for (const chunk of chunks) {
        expect(chunk.llmResponse.message?.tool_calls).toBeUndefined();
      }

      // The final accumulated message should contain both text segments
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.llmResponse.message?.content).toContain(
        "Using skill...",
      );
      expect(lastChunk.llmResponse.message?.content).toContain("Done.");
      expect(lastChunk.llmResponse.message?.content).toContain("\n\n");
    });

    it("does NOT suppress tools named 'shell' when no skills are configured", async () => {
      const client = createClient();
      const mockDeltas: StreamDelta[] = [
        { type: "tool-input-start", id: "call-1", toolName: "shell" },
        { type: "tool-input-delta", id: "call-1", delta: '{"cmd":"ls"}' },
        {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "shell",
          args: { cmd: "ls" },
        },
      ];

      const mockStream = createMockStreamResponse(mockDeltas);
      const chunks = [];
      for await (const chunk of callHandleStreamingResponse(
        client,
        mockStream,
        false,
      )) {
        chunks.push(chunk);
      }

      // Should have tool call data since skills are not configured
      const lastChunk = chunks[chunks.length - 1];
      expect(
        lastChunk.llmResponse.message?.tool_calls?.[0]?.function.name,
      ).toBe("shell");
    });

    it("emits TOOL_CALL events for skill tools with hasProviderSkills=false", async () => {
      const client = createClient();
      const mockDeltas: StreamDelta[] = [
        {
          type: "tool-input-start",
          id: "call-1",
          toolName: "code_execution",
        },
        { type: "tool-input-delta", id: "call-1", delta: '{"x":1}' },
        {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "code_execution",
          args: { x: 1 },
        },
      ];

      const mockStream = createMockStreamResponse(mockDeltas);
      const allEvents: any[] = [];
      for await (const chunk of callHandleStreamingResponse(
        client,
        mockStream,
        false,
      )) {
        allEvents.push(...chunk.aguiEvents);
      }

      // Should have TOOL_CALL_START since no provider skills
      const startEvents = allEvents.filter(
        (e: any) => e.type === EventType.TOOL_CALL_START,
      );
      expect(startEvents.length).toBe(1);
      expect(startEvents[0].toolCallName).toBe("code_execution");
    });

    it("suppresses all TOOL_CALL events for skill tools with hasProviderSkills=true", async () => {
      const client = createClient();
      const mockDeltas: StreamDelta[] = [
        {
          type: "tool-input-start",
          id: "call-1",
          toolName: "code_execution",
        },
        { type: "tool-input-delta", id: "call-1", delta: '{"x":1}' },
        {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "code_execution",
          args: { x: 1 },
        },
        {
          type: "tool-result",
          toolCallId: "call-1",
          result: "ok",
          providerExecuted: true,
        },
      ];

      const mockStream = createMockStreamResponse(mockDeltas);
      const allEvents: any[] = [];
      for await (const chunk of callHandleStreamingResponse(
        client,
        mockStream,
        true,
      )) {
        allEvents.push(...chunk.aguiEvents);
      }

      // No TOOL_CALL events at all
      const toolEvents = allEvents.filter(
        (e: any) =>
          e.type === EventType.TOOL_CALL_START ||
          e.type === EventType.TOOL_CALL_ARGS ||
          e.type === EventType.TOOL_CALL_END,
      );
      expect(toolEvents.length).toBe(0);
    });

    it("stitches text segments with separator when text resumes after skill", async () => {
      const client = createClient();
      const mockDeltas: StreamDelta[] = [
        { type: "text-start" },
        { type: "text-delta", text: "Before" },
        { type: "text-end" },
        {
          type: "tool-input-start",
          id: "call-1",
          toolName: "code_execution",
        },
        {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "code_execution",
          args: {},
        },
        {
          type: "tool-result",
          toolCallId: "call-1",
          result: "ok",
          providerExecuted: true,
        },
        { type: "text-start" },
        { type: "text-delta", text: "After" },
        { type: "text-end" },
      ];

      const mockStream = createMockStreamResponse(mockDeltas);
      const chunks = [];
      for await (const chunk of callHandleStreamingResponse(
        client,
        mockStream,
        true,
      )) {
        chunks.push(chunk);
      }

      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.llmResponse.message?.content).toBe("Before\n\nAfter");

      // Should reuse the same message ID (only one TEXT_MESSAGE_START with a new ID)
      const startEvents = chunks
        .flatMap((c: any) => c.aguiEvents)
        .filter((e: any) => e.type === EventType.TEXT_MESSAGE_START);
      const uniqueIds = new Set(startEvents.map((e: any) => e.messageId));
      expect(uniqueIds.size).toBe(1);
    });
  });
});
