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

// Type for the delta events from AI SDK's fullStream
type StreamDelta =
  | { type: "tool-input-start"; id: string; toolName: string }
  | { type: "tool-input-delta"; id: string; delta: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; args: unknown }
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
});
