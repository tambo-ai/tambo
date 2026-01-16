import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { useTamboThread } from "../providers";
import {
  useTamboClient,
  useTamboQueryClient,
} from "../providers/tambo-client-provider";
import { PartialTamboAI } from "../testing/types";
import { useTamboThreadList } from "./use-tambo-threads";

jest.mock("../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
  useTamboQueryClient: jest.fn(),
}));

jest.mock("../providers", () => ({
  useTamboThread: jest.fn(),
}));

describe("useTamboThreadList", () => {
  const mockThreads = [
    { id: "thread-1", title: "Thread 1" },
    { id: "thread-2", title: "Thread 2" },
  ];

  const mockProjects = {
    getCurrent: jest.fn(),
    retrieve: jest.fn(),
    delete: jest.fn(),
  } satisfies Partial<TamboAI["beta"]["projects"]>;

  const mockThreadsApi = {
    list: jest.fn(),
    messages: {
      list: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      updateComponentState: jest.fn(),
    },
    suggestions: {
      list: jest.fn(),
      generate: jest.fn(),
    },
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    advance: jest.fn(),
    advanceByID: jest.fn(),
  } satisfies NonNullable<PartialTamboAI["beta"]>["threads"];

  const mockBeta = {
    projects: mockProjects,
    threads: mockThreadsApi,
    registry: {
      retrieve: jest.fn(),
    },
  } satisfies PartialTamboAI["beta"];

  const mockTamboAI = {
    apiKey: "",
    beta: mockBeta,
  } satisfies PartialTamboAI as unknown as TamboAI;

  beforeEach(() => {
    jest.mocked(useTamboQueryClient).mockReturnValue(new QueryClient());
    jest
      .mocked(useTamboThread)
      .mockReturnValue({ contextKey: undefined } as any);
  });

  it("should fetch threads for current project when no projectId is provided", async () => {
    const mockClient = jest.mocked(useTamboClient);
    mockClient.mockReturnValue({
      ...mockTamboAI,
      beta: {
        ...mockBeta,
        projects: {
          ...mockProjects,
          getCurrent: jest.fn().mockResolvedValue({ id: "current-project" }),
        },
        threads: {
          ...mockThreadsApi,
          list: jest.fn().mockResolvedValue(mockThreads),
        },
      },
    } satisfies PartialTamboAI as any);

    const { result } = renderHook(() => useTamboThreadList());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockThreads);
    });
  });

  it("should fetch threads for specified projectId", async () => {
    const mockList = jest.fn().mockResolvedValue(mockThreads);
    const mockClient = jest.mocked(useTamboClient);
    mockClient.mockReturnValue({
      ...mockTamboAI,
      beta: {
        ...mockBeta,
        threads: {
          ...mockThreadsApi,
          list: mockList,
        },
      },
    } satisfies PartialTamboAI as any);

    const { result } = renderHook(() =>
      useTamboThreadList({ projectId: "custom-project" }),
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockThreads);
    });

    expect(mockList).toHaveBeenCalledWith("custom-project", {});
  });

  it("should fetch threads with contextKey when provided via TamboThreadProvider", async () => {
    jest
      .mocked(useTamboThread)
      .mockReturnValue({ contextKey: "test-context" } as any);
    const mockList = jest.fn().mockResolvedValue(mockThreads);
    const mockClient = jest.mocked(useTamboClient);
    mockClient.mockReturnValue({
      ...mockTamboAI,
      beta: {
        ...mockBeta,
        projects: {
          ...mockProjects,
          getCurrent: jest.fn().mockResolvedValue({ id: "current-project" }),
        },
        threads: {
          ...mockThreadsApi,
          list: mockList,
        },
      },
    } satisfies PartialTamboAI as any);

    const { result } = renderHook(() => useTamboThreadList());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockThreads);
    });

    expect(mockList).toHaveBeenCalledWith("current-project", {
      contextKey: "test-context",
    });
  });

  it("should handle loading state", async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const mockClient = jest.mocked(useTamboClient);
    mockClient.mockReturnValue({
      ...mockTamboAI,
      beta: {
        ...mockBeta,
        projects: {
          ...mockProjects,
          getCurrent: jest.fn().mockResolvedValue({ id: "current-project" }),
        },
        threads: {
          ...mockThreadsApi,
          list: jest.fn().mockReturnValue(promise),
        },
      },
    } satisfies PartialTamboAI as any);

    const { result } = renderHook(() =>
      useTamboThreadList({}, { retry: false }),
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "data": null,
        "dataUpdatedAt": 0,
        "error": null,
        "errorUpdateCount": 0,
        "errorUpdatedAt": 0,
        "failureCount": 0,
        "failureReason": null,
        "fetchStatus": "fetching",
        "isEnabled": true,
        "isError": false,
        "isFetched": false,
        "isFetchedAfterMount": false,
        "isFetching": true,
        "isInitialLoading": true,
        "isLoading": true,
        "isLoadingError": false,
        "isPaused": false,
        "isPending": true,
        "isPlaceholderData": false,
        "isRefetchError": false,
        "isRefetching": false,
        "isStale": true,
        "isSuccess": false,
        "promise": Promise {},
        "refetch": [Function],
        "status": "pending",
      }
    `);

    resolvePromise!(mockThreads);
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should handle error state", async () => {
    const mockError = new Error("Failed to fetch threads");
    const mockClient = jest.mocked(useTamboClient);
    mockClient.mockReturnValue({
      ...mockTamboAI,
      beta: {
        ...mockBeta,
        projects: {
          ...mockProjects,
          getCurrent: jest.fn().mockResolvedValue({ id: "current-project" }),
        },
        threads: {
          ...mockThreadsApi,
          list: jest.fn().mockImplementation(async () => {
            // console.log("Mocking error", mockCount++);
            throw mockError;
          }),
        },
      },
    } satisfies PartialTamboAI as any);

    const { result } = renderHook(() =>
      useTamboThreadList({}, { retry: false }),
    );

    await waitFor(() => {
      const { isLoading, error, isError } = result.current;
      expect(isLoading).toBe(false);
      expect(isError).toBe(true);
      expect(error).toBe(mockError);
    });
  });
});
