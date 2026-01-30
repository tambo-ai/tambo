import { EventType, type RunStartedEvent } from "@ag-ui/core";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  TamboV1StreamProvider,
  useStreamState,
  useStreamDispatch,
  useThreadManagement,
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

    it("returns initial state with empty threadMap", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
      );

      const { result } = renderHook(() => useStreamState(), { wrapper });

      expect(result.current.threadMap).toEqual({});
      expect(result.current.currentThreadId).toBeNull();
    });

    it("initializes thread via dispatch", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
      );

      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          dispatch: useStreamDispatch(),
        }),
        { wrapper },
      );

      act(() => {
        result.current.dispatch({
          type: "INIT_THREAD",
          threadId: "thread_123",
        });
      });

      expect(result.current.state.threadMap.thread_123).toBeDefined();
      expect(result.current.state.threadMap.thread_123.thread.id).toBe(
        "thread_123",
      );
      expect(result.current.state.threadMap.thread_123.thread.status).toBe(
        "idle",
      );
      expect(result.current.state.threadMap.thread_123.thread.messages).toEqual(
        [],
      );
    });

    it("initializes thread with initial data via dispatch", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
      );

      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          dispatch: useStreamDispatch(),
        }),
        { wrapper },
      );

      act(() => {
        result.current.dispatch({
          type: "INIT_THREAD",
          threadId: "thread_123",
          initialThread: {
            title: "Test Thread",
            metadata: { key: "value" },
          },
        });
      });

      expect(result.current.state.threadMap.thread_123.thread.title).toBe(
        "Test Thread",
      );
      expect(result.current.state.threadMap.thread_123.thread.metadata).toEqual(
        {
          key: "value",
        },
      );
      // Default values should still be set
      expect(result.current.state.threadMap.thread_123.thread.status).toBe(
        "idle",
      );
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
        <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
      );

      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          dispatch: useStreamDispatch(),
        }),
        { wrapper },
      );

      // Initialize the thread first
      act(() => {
        result.current.dispatch({
          type: "INIT_THREAD",
          threadId: "thread_123",
        });
      });

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

  describe("useThreadManagement", () => {
    it("throws when used outside provider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useThreadManagement());
      }).toThrow(
        "useThreadManagement must be used within TamboV1StreamProvider",
      );

      consoleSpy.mockRestore();
    });

    it("initThread creates a new thread", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
      );

      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          management: useThreadManagement(),
        }),
        { wrapper },
      );

      act(() => {
        result.current.management.initThread("thread_456");
      });

      expect(result.current.state.threadMap.thread_456).toBeDefined();
      expect(result.current.state.threadMap.thread_456.thread.id).toBe(
        "thread_456",
      );
    });

    it("switchThread changes currentThreadId", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
      );

      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          management: useThreadManagement(),
        }),
        { wrapper },
      );

      // Initialize and switch to a thread
      act(() => {
        result.current.management.initThread("thread_789");
        result.current.management.switchThread("thread_789");
      });

      expect(result.current.state.currentThreadId).toBe("thread_789");
    });

    it("startNewThread creates temp thread and switches to it", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
      );

      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          management: useThreadManagement(),
        }),
        { wrapper },
      );

      let tempId: string;
      act(() => {
        tempId = result.current.management.startNewThread();
      });

      expect(tempId!).toMatch(/^temp_/);
      expect(result.current.state.currentThreadId).toBe(tempId!);
      expect(result.current.state.threadMap[tempId!]).toBeDefined();
    });
  });
});
