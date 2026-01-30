import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { z } from "zod";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTamboRegistry } from "../../providers/tambo-registry-provider";
import { useTamboContextHelpers } from "../../providers/tambo-context-helpers-provider";
import { useStreamState, useThreadManagement } from "./tambo-v1-stream-context";
import { TamboV1Provider, useTamboV1Config } from "./tambo-v1-provider";

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

  it("registers static resources when provided", () => {
    const resources = [
      {
        uri: "resource://test/example",
        name: "Test Resource",
        description: "A test resource",
        mimeType: "text/plain",
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key" resources={resources}>
        {children}
      </TamboV1Provider>
    );

    const { result } = renderHook(() => useTamboRegistry(), { wrapper });

    expect(result.current.resources).toHaveLength(1);
    expect(result.current.resources[0].uri).toBe("resource://test/example");
    expect(result.current.resources[0].name).toBe("Test Resource");
  });

  it("registers resource source when listResources and getResource provided", () => {
    const listResources = jest.fn().mockResolvedValue({ resources: [] });
    const getResource = jest.fn().mockResolvedValue({ contents: [] });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider
        apiKey="test-api-key"
        listResources={listResources}
        getResource={getResource}
      >
        {children}
      </TamboV1Provider>
    );

    const { result } = renderHook(() => useTamboRegistry(), { wrapper });

    expect(result.current.resourceSource).toBeDefined();
    expect(result.current.resourceSource?.listResources).toBe(listResources);
    expect(result.current.resourceSource?.getResource).toBe(getResource);
  });

  it("provides userKey via useTamboV1Config", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key" userKey="my-user-key">
        {children}
      </TamboV1Provider>
    );

    const { result } = renderHook(() => useTamboV1Config(), { wrapper });

    expect(result.current.userKey).toBe("my-user-key");
  });

  it("returns undefined userKey from useTamboV1Config when no userKey provided", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key">{children}</TamboV1Provider>
    );

    const { result } = renderHook(() => useTamboV1Config(), { wrapper });

    expect(result.current.userKey).toBeUndefined();
  });

  it("provides context helpers via useTamboContextHelpers hook", async () => {
    const contextHelpers = {
      getUserName: () => "Test User",
      getCurrentTime: () => new Date().toISOString(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key" contextHelpers={contextHelpers}>
        {children}
      </TamboV1Provider>
    );

    const { result, rerender } = renderHook(() => useTamboContextHelpers(), {
      wrapper,
    });

    // Helpers are registered via useEffect, so we need to trigger a rerender
    await act(async () => {
      rerender();
    });

    const helpers = result.current.getContextHelpers();
    expect(helpers.getUserName).toBe(contextHelpers.getUserName);
    expect(helpers.getCurrentTime).toBe(contextHelpers.getCurrentTime);
  });

  it("returns empty contextHelpers when none provided", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboV1Provider apiKey="test-api-key">{children}</TamboV1Provider>
    );

    const { result } = renderHook(() => useTamboContextHelpers(), { wrapper });

    const helpers = result.current.getContextHelpers();
    expect(Object.keys(helpers)).toHaveLength(0);
  });
});
