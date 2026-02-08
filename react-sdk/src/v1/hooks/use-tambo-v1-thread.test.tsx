import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import {
  useTamboClient,
  useTamboQueryClient,
} from "../../providers/tambo-client-provider";
import { useTamboThread } from "./use-tambo-v1-thread";

jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
  useTamboQueryClient: jest.fn(),
}));

jest.mock("./use-tambo-v1-auth-state", () => ({
  useTamboAuthState: () => ({
    status: "identified",
    source: "userKey",
  }),
}));

describe("useTamboThread", () => {
  const mockThread = {
    id: "thread_123",
    runStatus: "idle",
    messages: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
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
    jest.mocked(useTamboQueryClient).mockReturnValue(queryClient);
    mockThreadsApi.retrieve.mockReset();
  });

  it("fetches thread by ID", async () => {
    mockThreadsApi.retrieve.mockResolvedValue(mockThread);

    const { result } = renderHook(() => useTamboThread("thread_123"), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockThread);
    });

    expect(mockThreadsApi.retrieve).toHaveBeenCalledWith("thread_123");
  });

  it("handles loading state", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockThreadsApi.retrieve.mockReturnValue(promise);

    const { result } = renderHook(() => useTamboThread("thread_123"), {
      wrapper: TestWrapper,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    resolvePromise!(mockThread);
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error state", async () => {
    const mockError = new Error("Thread not found");
    mockThreadsApi.retrieve.mockRejectedValue(mockError);

    const { result } = renderHook(() => useTamboThread("thread_123"), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(mockError);
    });
  });
});
