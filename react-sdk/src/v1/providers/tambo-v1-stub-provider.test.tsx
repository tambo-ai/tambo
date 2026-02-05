import { renderHook } from "@testing-library/react";
import React from "react";
import { TamboV1StubProvider } from "./tambo-v1-stub-provider";
import { useTamboV1 } from "../hooks/use-tambo-v1";
import { useTamboV1ThreadInput } from "../hooks/use-tambo-v1-thread-input";
import { useTamboRegistry } from "../../providers/tambo-registry-provider";
import { useTamboClient } from "../../providers/tambo-client-provider";
import type { TamboV1Thread } from "../types/thread";

describe("TamboV1StubProvider", () => {
  const mockThread: TamboV1Thread = {
    id: "thread_123",
    messages: [
      {
        id: "msg_1",
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "msg_2",
        role: "assistant",
        content: [{ type: "text", text: "Hi there!" }],
        createdAt: "2024-01-01T00:00:01Z",
      },
    ],
    status: "idle",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:01Z",
    lastRunCancelled: false,
  };

  describe("useTamboV1", () => {
    it("provides thread data via useTamboV1", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider thread={mockThread}>
          {children}
        </TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboV1(), {
        wrapper,
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].id).toBe("msg_1");
      expect(result.current.messages[1].id).toBe("msg_2");
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isStreaming).toBe(false);
    });

    it("returns empty messages when no thread provided", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider>{children}</TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboV1(), {
        wrapper,
      });

      expect(result.current.messages).toHaveLength(0);
      expect(result.current.isIdle).toBe(true);
    });

    it("shows streaming state when isStreaming prop is true", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider thread={mockThread} isStreaming>
          {children}
        </TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboV1(), {
        wrapper,
      });

      expect(result.current.isStreaming).toBe(true);
      expect(result.current.isIdle).toBe(false);
    });
  });

  describe("useTamboV1ThreadInput", () => {
    it("provides thread input context", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider thread={mockThread}>
          {children}
        </TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboV1ThreadInput(), { wrapper });

      expect(result.current.value).toBe("");
      expect(result.current.threadId).toBe("thread_123");
      expect(typeof result.current.setValue).toBe("function");
      expect(typeof result.current.submit).toBe("function");
    });

    it("uses initial input value when provided", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider thread={mockThread} inputValue="Hello world">
          {children}
        </TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboV1ThreadInput(), { wrapper });

      expect(result.current.value).toBe("Hello world");
    });

    it("calls custom onSubmit when provided", async () => {
      const mockOnSubmit = jest
        .fn()
        .mockResolvedValue({ threadId: "new_thread" });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider thread={mockThread} onSubmit={mockOnSubmit}>
          {children}
        </TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboV1ThreadInput(), { wrapper });

      const response = await result.current.submit();

      expect(mockOnSubmit).toHaveBeenCalled();
      expect(response.threadId).toBe("new_thread");
    });
  });

  describe("Registry", () => {
    it("registers provided components", () => {
      const TestComponent = () => <div>Test</div>;
      const components = [
        {
          name: "TestComponent",
          description: "A test component",
          component: TestComponent,
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider thread={mockThread} components={components}>
          {children}
        </TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      expect(result.current.componentList.TestComponent).toBeDefined();
      expect(result.current.componentList.TestComponent.name).toBe(
        "TestComponent",
      );
    });

    it("registers provided tools", () => {
      const tools = [
        {
          name: "testTool",
          description: "A test tool",
          tool: async () => "result",
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider thread={mockThread} tools={tools as any}>
          {children}
        </TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      expect(result.current.toolRegistry.testTool).toBeDefined();
      expect(result.current.toolRegistry.testTool.name).toBe("testTool");
    });
  });

  describe("Client", () => {
    it("provides stub client", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider thread={mockThread}>
          {children}
        </TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboClient(), { wrapper });

      expect(result.current).toBeDefined();
    });
  });

  describe("Thread management", () => {
    it("provides thread management functions", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider thread={mockThread}>
          {children}
        </TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboV1(), {
        wrapper,
      });

      expect(typeof result.current.startNewThread).toBe("function");
      expect(typeof result.current.switchThread).toBe("function");
      expect(typeof result.current.initThread).toBe("function");
    });

    it("calls custom onStartNewThread when provided", () => {
      const mockStartNewThread = jest.fn().mockReturnValue("custom_thread_id");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider
          thread={mockThread}
          onStartNewThread={mockStartNewThread}
        >
          {children}
        </TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboV1(), {
        wrapper,
      });

      const newThreadId = result.current.startNewThread();

      expect(mockStartNewThread).toHaveBeenCalled();
      expect(newThreadId).toBe("custom_thread_id");
    });
  });

  describe("Messages-only thread", () => {
    it("accepts just messages array instead of full thread", () => {
      const messages = [
        {
          id: "msg_1",
          role: "user" as const,
          content: [{ type: "text" as const, text: "Hello" }],
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboV1StubProvider thread={{ messages }} threadId="custom_id">
          {children}
        </TamboV1StubProvider>
      );

      const { result } = renderHook(() => useTamboV1(), { wrapper });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe("msg_1");
    });
  });
});
