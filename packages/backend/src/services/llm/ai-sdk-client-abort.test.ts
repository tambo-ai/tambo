import {
  ContentPartType,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { streamText } from "ai";
import { AISdkClient } from "./ai-sdk-client";

// Mock the message ID generator
jest.mock("./message-id-generator", () => ({
  generateMessageId: jest.fn(() => "message-1"),
}));

// Mock the langfuse config
jest.mock("../../config/langfuse.config", () => ({
  createLangfuseTelemetryConfig: jest.fn(() => undefined),
}));

// Mock streamText from "ai" so we can verify its args
jest.mock("ai", () => {
  const actual = jest.requireActual("ai");
  return {
    ...actual,
    streamText: jest.fn(),
  };
});

const mockStreamText = jest.mocked(streamText);

describe("AISdkClient abortSignal propagation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createClient() {
    const client = new AISdkClient(
      "test-api-key",
      "gpt-4o",
      "openai",
      "test-chain",
      "test-user",
    );

    // Mock getModelInstance to avoid creating real provider instances
    jest.spyOn(client as never, "getModelInstance").mockReturnValue({
      supportedUrls: Promise.resolve({}),
      provider: "openai",
      modelId: "gpt-4o",
    } as never);

    return client;
  }

  function createMinimalMessages(): ThreadMessage[] {
    return [
      {
        id: "msg-1",
        threadId: "thread-1",
        role: MessageRole.User,
        content: [{ type: ContentPartType.Text, text: "hello" }],
        createdAt: new Date(),
        componentState: {},
      },
    ];
  }

  function setupMockStream() {
    mockStreamText.mockResolvedValue({
      fullStream: (async function* () {
        yield { type: "text-start" as const };
        yield { type: "text-delta" as const, text: "hi" };
        yield { type: "finish" as const };
      })(),
    } as never);
  }

  it("should pass abortSignal to streamText when provided", async () => {
    const client = createClient();
    setupMockStream();

    const abortController = new AbortController();

    const stream = await client.complete({
      messages: createMinimalMessages(),
      stream: true as const,
      promptTemplateName: "test",
      promptTemplateParams: {},
      abortSignal: abortController.signal,
    });

    // Consume the stream
    for await (const _chunk of stream) {
      // just drain
    }

    expect(mockStreamText).toHaveBeenCalledTimes(1);
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        abortSignal: abortController.signal,
      }),
    );
  });

  it("should pass undefined abortSignal to streamText when not provided", async () => {
    const client = createClient();
    setupMockStream();

    const stream = await client.complete({
      messages: createMinimalMessages(),
      stream: true as const,
      promptTemplateName: "test",
      promptTemplateParams: {},
    });

    for await (const _chunk of stream) {
      // just drain
    }

    expect(mockStreamText).toHaveBeenCalledTimes(1);
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        abortSignal: undefined,
      }),
    );
  });
});
