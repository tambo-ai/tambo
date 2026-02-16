/**
 * Tests for createThreadsClient
 */

import { QueryClient } from "@tanstack/query-core";
import { createThreadsClient, type ThreadsClient } from "./threads";
import type {
  ThreadCreateResponse,
  ThreadRetrieveResponse,
  ThreadListResponse,
  MessageListResponse,
} from "./types";
import { threadKeys } from "./query";

function createMockDeps() {
  const mockSdk = {
    threads: {
      create: jest.fn(),
      list: jest.fn(),
      retrieve: jest.fn(),
      delete: jest.fn(),
      messages: {
        list: jest.fn(),
      },
    },
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 60_000 },
    },
  });

  return { mockSdk, queryClient };
}

describe("createThreadsClient", () => {
  let threads: ThreadsClient;
  let mockSdk: ReturnType<typeof createMockDeps>["mockSdk"];
  let queryClient: QueryClient;

  beforeEach(() => {
    const deps = createMockDeps();
    mockSdk = deps.mockSdk;
    queryClient = deps.queryClient;
    threads = createThreadsClient({
      sdk: mockSdk as never,
      queryClient,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("create", () => {
    it("calls sdk.threads.create with params", async () => {
      const params = { userKey: "user_456", metadata: { foo: "bar" } };
      const mockThread: ThreadCreateResponse = {
        id: "thread_789",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        runStatus: "idle",
        userKey: "user_456",
      };

      mockSdk.threads.create.mockResolvedValue(mockThread);

      const result = await threads.create(params);

      expect(mockSdk.threads.create).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockThread);
    });

    it("invalidates list cache after creation", async () => {
      mockSdk.threads.create.mockResolvedValue({
        id: "thread_1",
        createdAt: "",
        updatedAt: "",
        runStatus: "idle" as const,
      });

      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      await threads.create({});

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: threadKeys.lists(),
      });
    });
  });

  describe("list", () => {
    it("calls sdk.threads.list and caches result", async () => {
      const mockResponse: ThreadListResponse = {
        threads: [
          {
            id: "thread_1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            runStatus: "idle",
          },
        ],
        hasMore: false,
      };

      mockSdk.threads.list.mockResolvedValue(mockResponse);

      const result = await threads.list({ limit: 10 });

      expect(mockSdk.threads.list).toHaveBeenCalledWith({ limit: 10 });
      expect(result).toEqual(mockResponse);

      // Second call should hit cache, not SDK
      const result2 = await threads.list({ limit: 10 });
      expect(result2).toEqual(mockResponse);
      expect(mockSdk.threads.list).toHaveBeenCalledTimes(1);
    });
  });

  describe("get", () => {
    it("calls sdk.threads.retrieve and caches result", async () => {
      const mockThread: ThreadRetrieveResponse = {
        id: "thread_123",
        messages: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        runStatus: "idle",
      };

      mockSdk.threads.retrieve.mockResolvedValue(mockThread);

      const result = await threads.get("thread_123");

      expect(mockSdk.threads.retrieve).toHaveBeenCalledWith("thread_123");
      expect(result).toEqual(mockThread);

      // Second call should hit cache
      await threads.get("thread_123");
      expect(mockSdk.threads.retrieve).toHaveBeenCalledTimes(1);
    });
  });

  describe("delete", () => {
    it("calls sdk.threads.delete and invalidates caches", async () => {
      mockSdk.threads.delete.mockResolvedValue(undefined);

      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
      const removeSpy = jest.spyOn(queryClient, "removeQueries");

      await threads.delete("thread_123");

      expect(mockSdk.threads.delete).toHaveBeenCalledWith("thread_123");
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: threadKeys.lists(),
      });
      expect(removeSpy).toHaveBeenCalledWith({
        queryKey: threadKeys.detail("thread_123"),
      });
    });
  });

  describe("listMessages", () => {
    it("calls sdk.threads.messages.list and caches result", async () => {
      const mockResponse: MessageListResponse = {
        messages: [
          {
            id: "msg_1",
            content: [{ type: "text", text: "Hello" }],
            role: "user",
          },
        ],
        hasMore: false,
      };

      mockSdk.threads.messages.list.mockResolvedValue(mockResponse);

      const result = await threads.listMessages("thread_123");

      expect(mockSdk.threads.messages.list).toHaveBeenCalledWith("thread_123");
      expect(result).toEqual(mockResponse);
    });
  });
});
