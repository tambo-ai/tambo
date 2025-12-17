import TamboAI from "@tambo-ai/typescript-sdk";
import { renderHook } from "@testing-library/react";
import React, { act } from "react";
import { useTamboThreadList } from "../hooks/use-tambo-threads";
import { TamboThread } from "../model/tambo-thread";
import { TamboStubProvider } from "./tambo-stubs";

describe("TamboStubProvider threads functionality", () => {
  const mockThread: TamboThread = {
    id: "test-thread",
    messages: [],
    createdAt: "2024-01-01T00:00:00Z",
    projectId: "test-project",
    updatedAt: "2024-01-01T00:00:00Z",
    metadata: {},
  };

  const mockThreadsData: Partial<TamboAI.Beta.Threads.ThreadsOffsetAndLimit> = {
    items: [mockThread],
    total: 1,
    count: 1,
    getPaginatedItems: () => [mockThread],
    nextPageRequestOptions: () => ({
      offset: 1,
      limit: 10,
      path: "/threads",
      method: "get",
    }),
  };

  it("should populate query cache with threads data", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboStubProvider
        thread={mockThread}
        threads={mockThreadsData}
        projectId="test-project"
        components={[]}
        tools={[]}
      >
        {children}
      </TamboStubProvider>
    );

    const { result } = renderHook(() => useTamboThreadList(), { wrapper });
    // Wait for the effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // The hook should return the pre-populated threads data
    expect(result.current.data).toEqual(mockThreadsData);
    expect(result.current.isLoading).toBe(false);
  });

  it("should populate query cache with threads data using contextKey", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboStubProvider
        thread={mockThread}
        threads={mockThreadsData}
        projectId="test-project"
        contextKey="test-context"
        components={[]}
        tools={[]}
      >
        {children}
      </TamboStubProvider>
    );

    const { result } = renderHook(() => useTamboThreadList(), { wrapper });
    // Wait for the effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // The hook should return the pre-populated threads data for the specific context
    expect(result.current.data).toEqual(mockThreadsData);
    expect(result.current.isLoading).toBe(false);
  });

  it("should default projectId to thread.projectId when not provided", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboStubProvider
        thread={mockThread}
        threads={mockThreadsData}
        // No explicit projectId provided - should use thread.projectId
        components={[]}
        tools={[]}
      >
        {children}
      </TamboStubProvider>
    );

    const { result } = renderHook(() => useTamboThreadList(), { wrapper });
    // Wait for the effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // The hook should return the pre-populated threads data using thread.projectId
    expect(result.current.data).toEqual(mockThreadsData);
    expect(result.current.isLoading).toBe(false);
  });
});
