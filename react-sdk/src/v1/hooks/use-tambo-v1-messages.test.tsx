import {
  EventType,
  type TextMessageStartEvent,
  type TextMessageContentEvent,
  type TextMessageEndEvent,
} from "@ag-ui/core";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  TamboV1StreamProvider,
  useStreamDispatch,
} from "../providers/tambo-v1-stream-context";
import { useTamboV1Messages } from "./use-tambo-v1-messages";

describe("useTamboV1Messages", () => {
  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <TamboV1StreamProvider threadId="thread_123">
        {children}
      </TamboV1StreamProvider>
    );
  }

  it("returns empty messages when thread has no messages", () => {
    const { result } = renderHook(() => useTamboV1Messages("thread_123"), {
      wrapper: TestWrapper,
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.hasMessages).toBe(false);
    expect(result.current.messageCount).toBe(0);
    expect(result.current.lastMessage).toBeUndefined();
    expect(result.current.userMessages).toEqual([]);
    expect(result.current.assistantMessages).toEqual([]);
  });

  it("returns messages after events are dispatched", () => {
    const { result } = renderHook(
      () => ({
        messages: useTamboV1Messages("thread_123"),
        dispatch: useStreamDispatch(),
      }),
      { wrapper: TestWrapper },
    );

    // Simulate a text message being received
    act(() => {
      result.current.dispatch({
        type: "EVENT",
        event: {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg_1",
          role: "assistant",
        } as TextMessageStartEvent,
        threadId: "thread_123",
      });
    });

    act(() => {
      result.current.dispatch({
        type: "EVENT",
        event: {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg_1",
          delta: "Hello",
        } as TextMessageContentEvent,
        threadId: "thread_123",
      });
    });

    act(() => {
      result.current.dispatch({
        type: "EVENT",
        event: {
          type: EventType.TEXT_MESSAGE_END,
          messageId: "msg_1",
        } as TextMessageEndEvent,
        threadId: "thread_123",
      });
    });

    expect(result.current.messages.messages.length).toBe(1);
    expect(result.current.messages.hasMessages).toBe(true);
    expect(result.current.messages.messageCount).toBe(1);
    expect(result.current.messages.lastMessage?.id).toBe("msg_1");
    expect(result.current.messages.lastMessage?.role).toBe("assistant");
    expect(result.current.messages.assistantMessages.length).toBe(1);
    expect(result.current.messages.userMessages.length).toBe(0);
  });

  it("filters user and assistant messages correctly", () => {
    const { result } = renderHook(
      () => ({
        messages: useTamboV1Messages("thread_123"),
        dispatch: useStreamDispatch(),
      }),
      { wrapper: TestWrapper },
    );

    // Add user message
    act(() => {
      result.current.dispatch({
        type: "EVENT",
        event: {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg_user",
          role: "user",
        } as TextMessageStartEvent,
        threadId: "thread_123",
      });
    });

    act(() => {
      result.current.dispatch({
        type: "EVENT",
        event: {
          type: EventType.TEXT_MESSAGE_END,
          messageId: "msg_user",
        } as TextMessageEndEvent,
        threadId: "thread_123",
      });
    });

    // Add assistant message
    act(() => {
      result.current.dispatch({
        type: "EVENT",
        event: {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg_assistant",
          role: "assistant",
        } as TextMessageStartEvent,
        threadId: "thread_123",
      });
    });

    act(() => {
      result.current.dispatch({
        type: "EVENT",
        event: {
          type: EventType.TEXT_MESSAGE_END,
          messageId: "msg_assistant",
        } as TextMessageEndEvent,
        threadId: "thread_123",
      });
    });

    expect(result.current.messages.messageCount).toBe(2);
    expect(result.current.messages.userMessages.length).toBe(1);
    expect(result.current.messages.userMessages[0].id).toBe("msg_user");
    expect(result.current.messages.assistantMessages.length).toBe(1);
    expect(result.current.messages.assistantMessages[0].id).toBe(
      "msg_assistant",
    );
    expect(result.current.messages.lastMessage?.id).toBe("msg_assistant");
  });

  it("returns empty messages when threadId does not exist in threadMap", () => {
    const { result } = renderHook(
      () => useTamboV1Messages("nonexistent_thread"),
      {
        wrapper: TestWrapper,
      },
    );

    expect(result.current.messages).toEqual([]);
    expect(result.current.hasMessages).toBe(false);
    expect(result.current.messageCount).toBe(0);
  });
});
