import { EventType, type RunStartedEvent } from "@ag-ui/core";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  TamboV1StreamProvider,
  useStreamState,
  useStreamDispatch,
} from "./tambo-v1-stream-context";

describe("TamboV1StreamProvider", () => {
  describe("useStreamState", () => {
    it("throws when used outside provider", () => {
      // Suppress console.error for expected error
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useStreamState());
      }).toThrow("useStreamState must be used within TamboV1StreamProvider");

      consoleSpy.mockRestore();
    });

    it("returns initial state with empty threadMap when no threadId", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
      );

      const { result } = renderHook(() => useStreamState(), { wrapper });

      expect(result.current.threadMap).toEqual({});
      expect(result.current.currentThreadId).toBeNull();
    });

    it("initializes thread when threadId is provided", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StreamProvider threadId="thread_123">
          {children}
        </TamboV1StreamProvider>
      );

      const { result } = renderHook(() => useStreamState(), { wrapper });

      expect(result.current.currentThreadId).toBe("thread_123");
      expect(result.current.threadMap.thread_123).toBeDefined();
      expect(result.current.threadMap.thread_123.thread.id).toBe("thread_123");
      expect(result.current.threadMap.thread_123.thread.status).toBe("idle");
      expect(result.current.threadMap.thread_123.thread.messages).toEqual([]);
    });

    it("merges initialThread with default state", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StreamProvider
          threadId="thread_123"
          initialThread={{
            title: "Test Thread",
            metadata: { key: "value" },
          }}
        >
          {children}
        </TamboV1StreamProvider>
      );

      const { result } = renderHook(() => useStreamState(), { wrapper });

      expect(result.current.threadMap.thread_123.thread.title).toBe(
        "Test Thread",
      );
      expect(result.current.threadMap.thread_123.thread.metadata).toEqual({
        key: "value",
      });
      // Default values should still be set
      expect(result.current.threadMap.thread_123.thread.status).toBe("idle");
    });
  });

  describe("useStreamDispatch", () => {
    it("throws when used outside provider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useStreamDispatch());
      }).toThrow("useStreamDispatch must be used within TamboV1StreamProvider");

      consoleSpy.mockRestore();
    });

    it("dispatches events to update state", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StreamProvider threadId="thread_123">
          {children}
        </TamboV1StreamProvider>
      );

      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          dispatch: useStreamDispatch(),
        }),
        { wrapper },
      );

      const runStartedEvent: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_1",
        threadId: "thread_123",
      };

      act(() => {
        result.current.dispatch({
          type: "EVENT",
          event: runStartedEvent,
          threadId: "thread_123",
        });
      });

      expect(result.current.state.threadMap.thread_123.thread.status).toBe(
        "streaming",
      );
      expect(result.current.state.threadMap.thread_123.streaming.status).toBe(
        "streaming",
      );
      expect(result.current.state.threadMap.thread_123.streaming.runId).toBe(
        "run_1",
      );
    });
  });
});
