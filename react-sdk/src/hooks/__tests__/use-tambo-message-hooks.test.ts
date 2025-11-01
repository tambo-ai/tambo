import { renderHook } from "@testing-library/react";
import type { TamboThreadMessage } from "../../model/generate-component-response";

// Mock useTambo before importing hooks
const mockUseTambo = jest.fn();
jest.mock("../../providers/tambo-provider", () => ({
  useTambo: mockUseTambo,
}));

// Import hooks after mocking
import {
  useTamboMessageProps,
  useTamboMessageLoading,
  useTamboMessageReasoning,
  useTamboMessageToolCall,
} from "../index";

describe("useTamboMessageProps", () => {
  it("extracts message props correctly", () => {
    const message = {
      id: "msg-1",
      role: "assistant",
      content: [
        { type: "text", text: "Hello" },
        { type: "image_url", image_url: { url: "test.png" } },
      ],
      component: {
        reasoning: "This is my reasoning",
      },
    };

    const { result } = renderHook(() =>
      useTamboMessageProps(message as unknown as TamboThreadMessage),
    );

    expect(result.current.content).toBe("Hello");
    expect(result.current.hasContent).toBe(true);
    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0]).toMatchObject({
      kind: "image",
      url: "test.png",
      type: "image_url",
    });
    expect(result.current.images).toEqual(["test.png"]);
    expect(result.current.reasoning).toBe("This is my reasoning");
  });

  it("handles message without component", () => {
    const message = {
      id: "msg-1",
      role: "user",
      content: "Simple text message",
    };

    const { result } = renderHook(() =>
      useTamboMessageProps(message as unknown as TamboThreadMessage),
    );

    expect(result.current.content).toBe("Simple text message");
    expect(result.current.hasContent).toBe(true);
    expect(result.current.attachments).toEqual([]);
    expect(result.current.images).toEqual([]);
    expect(result.current.reasoning).toBe(null);
  });
});

describe("useTamboMessageLoading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when generating last message", () => {
    mockUseTambo.mockReturnValue({
      thread: { messages: [{ id: "msg-1" }, { id: "msg-2" }] },
      isIdle: false,
      generationStage: "STREAMING_RESPONSE",
    });

    const { result } = renderHook(() => useTamboMessageLoading("msg-2"));
    expect(result.current).toBe(true);
  });

  it("returns false when not generating", () => {
    mockUseTambo.mockReturnValue({
      thread: { messages: [{ id: "msg-1" }] },
      isIdle: true,
      generationStage: "IDLE",
    });

    const { result } = renderHook(() => useTamboMessageLoading());
    expect(result.current).toBe(false);
  });

  it("returns false when message id does not match last message", () => {
    mockUseTambo.mockReturnValue({
      thread: { messages: [{ id: "msg-1" }, { id: "msg-2" }] },
      isIdle: false,
      generationStage: "STREAMING_RESPONSE",
    });

    const { result } = renderHook(() => useTamboMessageLoading("msg-1"));
    expect(result.current).toBe(false);
  });
});

describe("useTamboMessageReasoning", () => {
  it("extracts reasoning from component", () => {
    const message = {
      id: "msg-1",
      role: "assistant",
      content: [],
      component: {
        reasoning: "Component reasoning text",
      },
    };

    const { result } = renderHook(() =>
      useTamboMessageReasoning(message as unknown as TamboThreadMessage),
    );

    expect(result.current).toBe("Component reasoning text");
  });

  it("returns null when no component", () => {
    const message = {
      id: "msg-1",
      role: "assistant",
      content: [],
    };

    const { result } = renderHook(() =>
      useTamboMessageReasoning(message as unknown as TamboThreadMessage),
    );

    expect(result.current).toBe(null);
  });
});

describe("useTamboMessageToolCall", () => {
  it("extracts tool call from message", () => {
    const toolCall = {
      id: "tool-1",
      name: "searchTool",
      arguments: { query: "test" },
    };

    const message = {
      id: "msg-1",
      role: "assistant",
      content: [],
      toolCallRequest: toolCall,
    };

    const { result } = renderHook(() =>
      useTamboMessageToolCall(message as unknown as TamboThreadMessage),
    );

    expect(result.current).toBe(toolCall);
  });

  it("falls back to component tool call", () => {
    const toolCall = {
      id: "tool-2",
      name: "fetchTool",
      arguments: { url: "https://example.com" },
    };

    const message = {
      id: "msg-1",
      role: "assistant",
      content: [],
      component: {
        toolCallRequest: toolCall,
      },
    };

    const { result } = renderHook(() =>
      useTamboMessageToolCall(message as unknown as TamboThreadMessage),
    );

    expect(result.current).toBe(toolCall);
  });

  it("returns null when no tool call", () => {
    const message = {
      id: "msg-1",
      role: "assistant",
      content: [],
    };

    const { result } = renderHook(() =>
      useTamboMessageToolCall(message as unknown as TamboThreadMessage),
    );

    expect(result.current).toBe(null);
  });
});
