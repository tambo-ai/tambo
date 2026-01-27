import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { z } from "zod";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTamboRegistry } from "../../providers/tambo-registry-provider";
import { useStreamState, useThreadManagement } from "./tambo-v1-stream-context";
import { TamboV1Provider } from "./tambo-v1-provider";

// Mock the client provider to capture the apiKey
jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
  TamboClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

describe("TamboV1Provider", () => {
  const mockClient = {
    apiKey: "test-api-key",
    threads: {},
  } as unknown as TamboAI;

  beforeEach(() => {
    jest.mocked(useTamboClient).mockReturnValue(mockClient);
  });

  it("provides access to registry context", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key">{children}</TamboV1Provider>
    );

    const { result } = renderHook(() => useTamboRegistry(), { wrapper });

    expect(result.current.componentList).toBeDefined();
    expect(result.current.toolRegistry).toBeDefined();
    expect(typeof result.current.registerComponent).toBe("function");
    expect(typeof result.current.registerTool).toBe("function");
  });

  it("provides access to stream context", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key">{children}</TamboV1Provider>
    );

    const { result } = renderHook(() => useStreamState(), { wrapper });

    expect(result.current.threadMap).toBeDefined();
    expect(result.current.currentThreadId).toBeNull();
  });

  it("manages threads via useThreadManagement", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key">{children}</TamboV1Provider>
    );

    const { result } = renderHook(
      () => ({
        state: useStreamState(),
        management: useThreadManagement(),
      }),
      { wrapper },
    );

    // Initially no thread
    expect(result.current.state.currentThreadId).toBeNull();

    // Initialize and switch to a thread
    act(() => {
      result.current.management.initThread("thread_123");
      result.current.management.switchThread("thread_123");
    });

    expect(result.current.state.currentThreadId).toBe("thread_123");
    expect(result.current.state.threadMap.thread_123).toBeDefined();
  });

  it("provides access to query client", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key">{children}</TamboV1Provider>
    );

    const { result } = renderHook(() => useQueryClient(), { wrapper });

    expect(result.current).toBeInstanceOf(QueryClient);
  });

  it("uses custom query client when provided", () => {
    const customClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key" queryClient={customClient}>
        {children}
      </TamboV1Provider>
    );

    const { result } = renderHook(() => useQueryClient(), { wrapper });

    expect(result.current).toBe(customClient);
  });

  it("registers components when provided", () => {
    const TestComponent = () => <div>Test</div>;
    const propsSchema = z.object({
      title: z.string().describe("The title"),
    });
    const components = [
      {
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        propsSchema,
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key" components={components}>
        {children}
      </TamboV1Provider>
    );

    const { result } = renderHook(() => useTamboRegistry(), { wrapper });

    expect(result.current.componentList.TestComponent).toBeDefined();
    expect(result.current.componentList.TestComponent.name).toBe(
      "TestComponent",
    );
  });

  it("registers tools when provided", () => {
    const inputSchema = z.object({
      query: z.string().describe("Search query"),
    });
    const outputSchema = z.string().describe("Result string");
    const tools = [
      {
        name: "testTool",
        description: "A test tool",
        tool: async () => "result",
        inputSchema,
        outputSchema,
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key" tools={tools}>
        {children}
      </TamboV1Provider>
    );

    const { result } = renderHook(() => useTamboRegistry(), { wrapper });

    expect(result.current.toolRegistry.testTool).toBeDefined();
    expect(result.current.toolRegistry.testTool.name).toBe("testTool");
  });

  it("registers MCP servers when provided", () => {
    const mcpServers = [
      { url: "https://mcp.example.com", name: "Example MCP" },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key" mcpServers={mcpServers}>
        {children}
      </TamboV1Provider>
    );

    const { result } = renderHook(() => useTamboRegistry(), { wrapper });

    expect(result.current.mcpServerInfos).toHaveLength(1);
    expect(result.current.mcpServerInfos[0].url).toBe(
      "https://mcp.example.com",
    );
  });

  it("provides onCallUnregisteredTool to registry", () => {
    const onCallUnregisteredTool = jest
      .fn()
      .mockResolvedValue("fallback result");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider
        apiKey="test-api-key"
        onCallUnregisteredTool={onCallUnregisteredTool}
      >
        {children}
      </TamboV1Provider>
    );

    const { result } = renderHook(() => useTamboRegistry(), { wrapper });

    expect(result.current.onCallUnregisteredTool).toBe(onCallUnregisteredTool);
  });
});
