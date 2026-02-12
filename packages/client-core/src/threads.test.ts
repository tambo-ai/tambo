/**
 * Tests for ThreadsClient
 */

import { ThreadsClient } from "./threads.js";
import type { TamboClient } from "./client.js";
import type { Thread, Message, ContentPart } from "./types.js";

describe("ThreadsClient", () => {
  let mockClient: TamboClient;
  let threadsClient: ThreadsClient;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    mockClient = { fetch: mockFetch } as unknown as TamboClient;
    threadsClient = new ThreadsClient(mockClient);
  });

  describe("create", () => {
    it("calls POST /threads with correct body", async () => {
      const params = {
        projectId: "proj_123",
        contextKey: "user_456",
        metadata: { foo: "bar" },
      };

      const mockThread: Thread = {
        id: "thread_789",
        projectId: "proj_123",
        contextKey: "user_456",
        messages: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        metadata: { foo: "bar" },
      };

      mockFetch.mockResolvedValue(mockThread);

      const result = await threadsClient.create(params);

      expect(mockFetch).toHaveBeenCalledWith("/threads", {
        method: "POST",
        body: params,
      });
      expect(result).toEqual(mockThread);
    });

    it("creates thread without optional fields", async () => {
      const params = { projectId: "proj_123" };

      const mockThread: Thread = {
        id: "thread_789",
        projectId: "proj_123",
        messages: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValue(mockThread);

      const result = await threadsClient.create(params);

      expect(mockFetch).toHaveBeenCalledWith("/threads", {
        method: "POST",
        body: params,
      });
      expect(result).toEqual(mockThread);
    });
  });

  describe("list", () => {
    it("calls GET /threads/project/:projectId with query params", async () => {
      const params = {
        projectId: "proj_123",
        contextKey: "user_456",
        limit: 20,
        offset: 10,
      };

      const mockThreads: Thread[] = [
        {
          id: "thread_1",
          projectId: "proj_123",
          messages: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "thread_2",
          projectId: "proj_123",
          messages: [],
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValue({
        items: mockThreads,
        total: 100,
        offset: 10,
        limit: 20,
        count: 2,
      });

      const result = await threadsClient.list(params);

      expect(mockFetch).toHaveBeenCalledWith(
        "/threads/project/proj_123?contextKey=user_456&limit=20&offset=10",
      );
      expect(result).toEqual(mockThreads);
    });

    it("lists threads without optional query params", async () => {
      const params = { projectId: "proj_123" };

      const mockThreads: Thread[] = [
        {
          id: "thread_1",
          projectId: "proj_123",
          messages: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValue({
        items: mockThreads,
        total: 1,
        offset: 0,
        limit: 10,
        count: 1,
      });

      const result = await threadsClient.list(params);

      expect(mockFetch).toHaveBeenCalledWith("/threads/project/proj_123");
      expect(result).toEqual(mockThreads);
    });

    it("handles empty thread list", async () => {
      const params = { projectId: "proj_123" };

      mockFetch.mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 10,
        count: 0,
      });

      const result = await threadsClient.list(params);

      expect(result).toEqual([]);
    });
  });

  describe("get", () => {
    it("calls GET /threads/:id", async () => {
      const threadId = "thread_123";

      const mockThread: Thread = {
        id: threadId,
        projectId: "proj_123",
        messages: [
          {
            id: "msg_1",
            threadId,
            role: "user",
            content: [{ type: "text", text: "Hello" }],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValue(mockThread);

      const result = await threadsClient.get(threadId);

      expect(mockFetch).toHaveBeenCalledWith("/threads/thread_123");
      expect(result).toEqual(mockThread);
    });
  });

  describe("delete", () => {
    it("calls DELETE /threads/:id", async () => {
      const threadId = "thread_123";

      mockFetch.mockResolvedValue(undefined);

      await threadsClient.delete(threadId);

      expect(mockFetch).toHaveBeenCalledWith("/threads/thread_123", {
        method: "DELETE",
      });
    });
  });

  describe("sendMessage", () => {
    it("sends message with ContentPart array", async () => {
      const threadId = "thread_123";
      const content: ContentPart[] = [
        { type: "text", text: "Hello" },
        {
          type: "image_url",
          image_url: { url: "https://example.com/image.jpg" },
        },
      ];

      const mockMessage: Message = {
        id: "msg_123",
        threadId,
        role: "user",
        content,
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValue(mockMessage);

      const result = await threadsClient.sendMessage(threadId, { content });

      expect(mockFetch).toHaveBeenCalledWith("/threads/thread_123/messages", {
        method: "POST",
        body: {
          role: "user",
          content,
          metadata: undefined,
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it("auto-wraps string content into ContentPart array", async () => {
      const threadId = "thread_123";
      const textContent = "Hello, world!";

      const mockMessage: Message = {
        id: "msg_123",
        threadId,
        role: "user",
        content: [{ type: "text", text: textContent }],
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValue(mockMessage);

      const result = await threadsClient.sendMessage(threadId, {
        content: textContent,
      });

      expect(mockFetch).toHaveBeenCalledWith("/threads/thread_123/messages", {
        method: "POST",
        body: {
          role: "user",
          content: [{ type: "text", text: textContent }],
          metadata: undefined,
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it("includes metadata when provided", async () => {
      const threadId = "thread_123";
      const metadata = { source: "web", sessionId: "sess_456" };

      const mockMessage: Message = {
        id: "msg_123",
        threadId,
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        createdAt: "2024-01-01T00:00:00Z",
        metadata,
      };

      mockFetch.mockResolvedValue(mockMessage);

      const result = await threadsClient.sendMessage(threadId, {
        content: "Hello",
        metadata,
      });

      expect(mockFetch).toHaveBeenCalledWith("/threads/thread_123/messages", {
        method: "POST",
        body: {
          role: "user",
          content: [{ type: "text", text: "Hello" }],
          metadata,
        },
      });
      expect(result).toEqual(mockMessage);
    });
  });
});
