import { renderHook } from "@testing-library/react";
import React from "react";
import {
  GenerationStage,
  TamboThreadMessage,
} from "../../model/generate-component-response";
import { useTambo } from "../../providers/tambo-provider";
import { useTamboThreadMessages } from "../use-tambo-thread-messages";
import { useTamboMessageProps } from "../use-tambo-message-props";
import { useTamboMessageLoading } from "../use-tambo-message-loading";
import { useTamboMessageReasoning } from "../use-tambo-message-reasoning";
import { useTamboMessageToolCall } from "../use-tambo-message-tool-call";

// Mock the useTambo hook
jest.mock("../../providers/tambo-provider", () => ({
  useTambo: jest.fn(),
}));

describe("useTamboThreadMessages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return messages, generation state, and isGenerating", () => {
    const mockMessages: TamboThreadMessage[] = [
      {
        id: "msg-1",
        content: [{ type: "text", text: "Hello" }],
        role: "user",
        threadId: "thread-1",
        createdAt: new Date().toISOString(),
        componentState: {},
      },
      {
        id: "msg-2",
        content: [{ type: "text", text: "Hi there!" }],
        role: "assistant",
        threadId: "thread-1",
        createdAt: new Date().toISOString(),
        componentState: {},
      },
    ];

    jest.mocked(useTambo).mockReturnValue({
      thread: {
        id: "thread-1",
        messages: mockMessages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: "project-1",
        metadata: {},
      },
      generationStage: GenerationStage.STREAMING_RESPONSE,
      isIdle: false,
    } as any);

    const { result } = renderHook(() => useTamboThreadMessages());

    expect(result.current.messages).toEqual(mockMessages);
    expect(result.current.isGenerating).toBe(true);
    expect(result.current.generationStage).toBe(
      GenerationStage.STREAMING_RESPONSE,
    );
  });

  it("should return empty array when thread has no messages", () => {
    jest.mocked(useTambo).mockReturnValue({
      thread: {
        id: "thread-1",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: "project-1",
        metadata: {},
      },
      generationStage: GenerationStage.IDLE,
      isIdle: true,
    } as any);

    const { result } = renderHook(() => useTamboThreadMessages());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generationStage).toBe(GenerationStage.IDLE);
  });

  it("should return empty array when thread is null", () => {
    jest.mocked(useTambo).mockReturnValue({
      thread: null,
      generationStage: GenerationStage.IDLE,
      isIdle: true,
    } as any);

    const { result } = renderHook(() => useTamboThreadMessages());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isGenerating).toBe(false);
  });

  it("should indicate generation is in progress during different stages", () => {
    jest.mocked(useTambo).mockReturnValue({
      thread: {
        id: "thread-1",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: "project-1",
        metadata: {},
      },
      generationStage: GenerationStage.CHOOSING_COMPONENT,
      isIdle: false,
    } as any);

    const { result } = renderHook(() => useTamboThreadMessages());

    expect(result.current.isGenerating).toBe(true);
    expect(result.current.generationStage).toBe(
      GenerationStage.CHOOSING_COMPONENT,
    );
  });

  it("should indicate generation is idle when complete", () => {
    jest.mocked(useTambo).mockReturnValue({
      thread: {
        id: "thread-1",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: "project-1",
        metadata: {},
      },
      generationStage: GenerationStage.COMPLETE,
      isIdle: true,
    } as any);

    const { result } = renderHook(() => useTamboThreadMessages());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generationStage).toBe(GenerationStage.COMPLETE);
  });
});

describe("useTamboMessageProps", () => {
  it("should extract text content from message", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Hello world" }],
      role: "user",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.content).toBe("Hello world");
    expect(result.current.hasContent).toBe(true);
    expect(result.current.images).toEqual([]);
    expect(result.current.attachments).toEqual([]);
    expect(result.current.reasoning).toBeNull();
    expect(result.current.toolCall).toBeNull();
  });

  it("should extract multiple text content parts", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [
        { type: "text", text: "First part" },
        { type: "text", text: "Second part" },
      ],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.content).toBe("First part\nSecond part");
    expect(result.current.hasContent).toBe(true);
  });

  it("should extract image URLs from content", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [
        { type: "text", text: "Check this image:" },
        {
          type: "image_url",
          image_url: { url: "https://example.com/image.png" },
        },
      ],
      role: "user",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.images).toEqual(["https://example.com/image.png"]);
    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0].kind).toBe("image");
    expect(result.current.attachments[0].url).toBe(
      "https://example.com/image.png",
    );
  });

  it("should extract multiple images from content", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [
        {
          type: "image_url",
          image_url: { url: "data:image/png;base64,abc123" },
        },
        {
          type: "image_url",
          image_url: { url: "data:image/jpeg;base64,def456" },
        },
      ],
      role: "user",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.images).toEqual([
      "data:image/png;base64,abc123",
      "data:image/jpeg;base64,def456",
    ]);
    expect(result.current.attachments).toHaveLength(2);
    expect(result.current.attachments[0].kind).toBe("image");
    expect(result.current.attachments[0].mimeType).toBe("image/png");
    expect(result.current.attachments[1].kind).toBe("image");
    expect(result.current.attachments[1].mimeType).toBe("image/jpeg");
  });

  it("should extract reasoning from component", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Response" }],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      component: {
        reasoning: "I chose this component because...",
      } as any,
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.reasoning).toBe("I chose this component because...");
  });

  it("should extract reasoning from component.message as fallback", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Response" }],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      component: {
        message: "Fallback reasoning message",
      } as any,
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.reasoning).toBe("Fallback reasoning message");
  });

  it("should extract tool call from toolCallRequest", () => {
    const toolCall = {
      toolName: "getWeather",
      parameters: [
        { parameterName: "location", parameterValue: "San Francisco" },
      ],
    };

    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Calling tool..." }],
      role: "tool",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      toolCallRequest: toolCall,
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.toolCall).toEqual(toolCall);
  });

  it("should extract tool call from component.toolCallRequest as fallback", () => {
    const toolCall = {
      toolName: "searchDatabase",
      parameters: [{ parameterName: "query", parameterValue: "test" }],
    };

    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Searching..." }],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      component: {
        toolCallRequest: toolCall,
      } as any,
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.toolCall).toEqual(toolCall);
  });

  it("should handle string content", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: "Simple string content" as any,
      role: "user",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.content).toBe("Simple string content");
    expect(result.current.hasContent).toBe(true);
    expect(result.current.images).toEqual([]);
    expect(result.current.attachments).toEqual([]);
  });

  it("should handle empty content", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [],
      role: "user",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.content).toBe("");
    expect(result.current.hasContent).toBe(false);
    expect(result.current.images).toEqual([]);
    expect(result.current.attachments).toEqual([]);
  });

  it("should handle null content", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: null as any,
      role: "user",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.content).toBe("");
    expect(result.current.hasContent).toBe(false);
  });

  it("should extract audio attachments", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [
        {
          type: "input_audio",
          input_audio: {
            data: "base64data",
            format: "wav",
          },
        },
      ],
      role: "user",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0].kind).toBe("audio");
    expect(result.current.attachments[0].mimeType).toBe("audio/wav");
    expect(result.current.attachments[0].url).toBeUndefined();
  });

  it("should handle ReactElement content", () => {
    const reactElement = React.createElement("div", null, "Test");
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: reactElement as any,
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    const { result } = renderHook(() => useTamboMessageProps(message));

    expect(result.current.content).toBe(reactElement);
    expect(result.current.hasContent).toBe(true);
  });
});

describe("useTamboMessageLoading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return isLoading=true for last message when generating", () => {
    const messages: TamboThreadMessage[] = [
      {
        id: "msg-1",
        content: [{ type: "text", text: "Hello" }],
        role: "user",
        threadId: "thread-1",
        createdAt: new Date().toISOString(),
        componentState: {},
      },
      {
        id: "msg-2",
        content: [{ type: "text", text: "Generating..." }],
        role: "assistant",
        threadId: "thread-1",
        createdAt: new Date().toISOString(),
        componentState: {},
      },
    ];

    jest.mocked(useTambo).mockReturnValue({
      thread: {
        id: "thread-1",
        messages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: "project-1",
        metadata: {},
      },
      generationStage: GenerationStage.STREAMING_RESPONSE,
      isIdle: false,
    } as any);

    const { result } = renderHook(() => useTamboMessageLoading(messages[1]));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.generationStage).toBe(
      GenerationStage.STREAMING_RESPONSE,
    );
  });

  it("should return isLoading=false for non-last messages", () => {
    const messages: TamboThreadMessage[] = [
      {
        id: "msg-1",
        content: [{ type: "text", text: "Hello" }],
        role: "user",
        threadId: "thread-1",
        createdAt: new Date().toISOString(),
        componentState: {},
      },
      {
        id: "msg-2",
        content: [{ type: "text", text: "Response" }],
        role: "assistant",
        threadId: "thread-1",
        createdAt: new Date().toISOString(),
        componentState: {},
      },
    ];

    jest.mocked(useTambo).mockReturnValue({
      thread: {
        id: "thread-1",
        messages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: "project-1",
        metadata: {},
      },
      generationStage: GenerationStage.STREAMING_RESPONSE,
      isIdle: false,
    } as any);

    // Check first message
    const { result } = renderHook(() => useTamboMessageLoading(messages[0]));

    expect(result.current.isLoading).toBe(false);
  });

  it("should return isLoading=false when not generating", () => {
    const messages: TamboThreadMessage[] = [
      {
        id: "msg-1",
        content: [{ type: "text", text: "Hello" }],
        role: "user",
        threadId: "thread-1",
        createdAt: new Date().toISOString(),
        componentState: {},
      },
    ];

    jest.mocked(useTambo).mockReturnValue({
      thread: {
        id: "thread-1",
        messages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: "project-1",
        metadata: {},
      },
      generationStage: GenerationStage.COMPLETE,
      isIdle: true,
    } as any);

    const { result } = renderHook(() => useTamboMessageLoading(messages[0]));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.generationStage).toBe(GenerationStage.COMPLETE);
  });

  it("should return isLoading=false for empty message list", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Hello" }],
      role: "user",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    jest.mocked(useTambo).mockReturnValue({
      thread: {
        id: "thread-1",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: "project-1",
        metadata: {},
      },
      generationStage: GenerationStage.STREAMING_RESPONSE,
      isIdle: false,
    } as any);

    const { result } = renderHook(() => useTamboMessageLoading(message));

    expect(result.current.isLoading).toBe(false);
  });

  it("should handle different generation stages", () => {
    const messages: TamboThreadMessage[] = [
      {
        id: "msg-1",
        content: [{ type: "text", text: "Hello" }],
        role: "user",
        threadId: "thread-1",
        createdAt: new Date().toISOString(),
        componentState: {},
      },
    ];

    jest.mocked(useTambo).mockReturnValue({
      thread: {
        id: "thread-1",
        messages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: "project-1",
        metadata: {},
      },
      generationStage: GenerationStage.FETCHING_CONTEXT,
      isIdle: false,
    } as any);

    const { result } = renderHook(() => useTamboMessageLoading(messages[0]));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.generationStage).toBe(
      GenerationStage.FETCHING_CONTEXT,
    );
  });
});

describe("useTamboMessageReasoning", () => {
  it("should extract reasoning from component.reasoning", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Response" }],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      component: {
        reasoning: "This is my reasoning",
      } as any,
    };

    const { result } = renderHook(() => useTamboMessageReasoning(message));

    expect(result.current.reasoning).toBe("This is my reasoning");
    expect(result.current.hasReasoning).toBe(true);
  });

  it("should extract reasoning from component.message as fallback", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Response" }],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      component: {
        message: "Fallback message",
      } as any,
    };

    const { result } = renderHook(() => useTamboMessageReasoning(message));

    expect(result.current.reasoning).toBe("Fallback message");
    expect(result.current.hasReasoning).toBe(true);
  });

  it("should return null when no reasoning exists", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Response" }],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    const { result } = renderHook(() => useTamboMessageReasoning(message));

    expect(result.current.reasoning).toBeNull();
    expect(result.current.hasReasoning).toBe(false);
  });

  it("should handle empty component object", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Response" }],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      component: {} as any,
    };

    const { result } = renderHook(() => useTamboMessageReasoning(message));

    expect(result.current.reasoning).toBeNull();
    expect(result.current.hasReasoning).toBe(false);
  });

  it("should prefer reasoning over message when both exist", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Response" }],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      component: {
        reasoning: "Primary reasoning",
        message: "Fallback message",
      } as any,
    };

    const { result } = renderHook(() => useTamboMessageReasoning(message));

    expect(result.current.reasoning).toBe("Primary reasoning");
    expect(result.current.hasReasoning).toBe(true);
  });
});

describe("useTamboMessageToolCall", () => {
  it("should extract tool call from toolCallRequest", () => {
    const toolCall = {
      toolName: "getWeather",
      parameters: [
        { parameterName: "location", parameterValue: "San Francisco" },
      ],
    };

    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Calling tool..." }],
      role: "tool",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      toolCallRequest: toolCall,
    };

    const { result } = renderHook(() => useTamboMessageToolCall(message));

    expect(result.current.toolCall).toEqual(toolCall);
    expect(result.current.hasToolCall).toBe(true);
  });

  it("should extract tool call from component.toolCallRequest as fallback", () => {
    const toolCall = {
      toolName: "searchDatabase",
      parameters: [{ parameterName: "query", parameterValue: "test query" }],
    };

    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Searching..." }],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      component: {
        toolCallRequest: toolCall,
      } as any,
    };

    const { result } = renderHook(() => useTamboMessageToolCall(message));

    expect(result.current.toolCall).toEqual(toolCall);
    expect(result.current.hasToolCall).toBe(true);
  });

  it("should return null when no tool call exists", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Regular message" }],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    const { result } = renderHook(() => useTamboMessageToolCall(message));

    expect(result.current.toolCall).toBeNull();
    expect(result.current.hasToolCall).toBe(false);
  });

  it("should handle empty component object", () => {
    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Response" }],
      role: "assistant",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      component: {} as any,
    };

    const { result } = renderHook(() => useTamboMessageToolCall(message));

    expect(result.current.toolCall).toBeNull();
    expect(result.current.hasToolCall).toBe(false);
  });

  it("should prefer toolCallRequest over component.toolCallRequest", () => {
    const primaryToolCall = {
      toolName: "primaryTool",
      parameters: [{ parameterName: "arg", parameterValue: "primary" }],
    };

    const fallbackToolCall = {
      toolName: "fallbackTool",
      parameters: [{ parameterName: "arg", parameterValue: "fallback" }],
    };

    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Tool call" }],
      role: "tool",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      toolCallRequest: primaryToolCall,
      component: {
        toolCallRequest: fallbackToolCall,
      } as any,
    };

    const { result } = renderHook(() => useTamboMessageToolCall(message));

    expect(result.current.toolCall).toEqual(primaryToolCall);
    expect(result.current.hasToolCall).toBe(true);
  });

  it("should handle tool call with multiple parameters", () => {
    const toolCall = {
      toolName: "complexTool",
      parameters: [
        { parameterName: "param1", parameterValue: "value1" },
        { parameterName: "param2", parameterValue: "value2" },
        { parameterName: "param3", parameterValue: "value3" },
      ],
    };

    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Executing tool..." }],
      role: "tool",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      toolCallRequest: toolCall,
    };

    const { result } = renderHook(() => useTamboMessageToolCall(message));

    expect(result.current.toolCall).toEqual(toolCall);
    expect(result.current.toolCall?.parameters).toHaveLength(3);
  });

  it("should handle tool call with no parameters", () => {
    const toolCall = {
      toolName: "noParamsTool",
      parameters: [],
    };

    const message: TamboThreadMessage = {
      id: "msg-1",
      content: [{ type: "text", text: "Tool call" }],
      role: "tool",
      threadId: "thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
      toolCallRequest: toolCall,
    };

    const { result } = renderHook(() => useTamboMessageToolCall(message));

    expect(result.current.toolCall).toEqual(toolCall);
    expect(result.current.hasToolCall).toBe(true);
  });
});
