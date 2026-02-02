import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTamboV1ThreadList } from "./use-tambo-v1-thread-list";

jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
}));

describe("useTamboV1ThreadList", () => {
  const mockThreads = {
    threads: [
      { id: "thread_1", runStatus: "idle" },
      { id: "thread_2", runStatus: "complete" },
    ],
    hasMore: false,
    nextCursor: undefined,
  };

  const mockThreadsApi = {
    retrieve: jest.fn(),
    list: jest.fn(),
  };

  const mockTamboAI = {
    apiKey: "",
    threads: mockThreadsApi,
  } as unknown as TamboAI;

  let queryClient: QueryClient;

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.mocked(useTamboClient).mockReturnValue(mockTamboAI);
    mockThreadsApi.list.mockReset();
  });

  it("fetches thread list", async () => {
    mockThreadsApi.list.mockResolvedValue(mockThreads);

    const { result } = renderHook(() => useTamboV1ThreadList(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockThreads);
    });

    expect(mockThreadsApi.list).toHaveBeenCalledWith(undefined);
  });

  it("passes list options to API", async () => {
    mockThreadsApi.list.mockResolvedValue(mockThreads);

    const { result } = renderHook(
      () =>
        useTamboV1ThreadList({
          userKey: "test-context",
          limit: "10",
        }),
      { wrapper: TestWrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockThreads);
    });

    expect(mockThreadsApi.list).toHaveBeenCalledWith({
      userKey: "test-context",
      limit: "10",
    });
  });

  it("handles loading state", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockThreadsApi.list.mockReturnValue(promise);

    const { result } = renderHook(() => useTamboV1ThreadList(), {
      wrapper: TestWrapper,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    resolvePromise!(mockThreads);
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error state", async () => {
    const mockError = new Error("Failed to fetch threads");
    mockThreadsApi.list.mockRejectedValue(mockError);

    const { result } = renderHook(() => useTamboV1ThreadList(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(mockError);
    });
  });
});
