import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import {
  V1RunStatus,
  ContentPartType,
  GenerationStage,
} from "@tambo-ai-cloud/core";
import { V1Service } from "../v1.service";
import {
  encodeV1CompoundCursor,
  parseV1CompoundCursor,
} from "../v1-pagination";

// Mock the database operations module
jest.mock("@tambo-ai-cloud/db", () => ({
  operations: {
    createThread: jest.fn(),
    deleteThread: jest.fn(),
  },
  schema: {
    threads: {
      id: { name: "id" },
      projectId: { name: "projectId" },
      contextKey: { name: "contextKey" },
      createdAt: { name: "createdAt" },
    },
    messages: {
      id: { name: "id" },
      threadId: { name: "threadId" },
      createdAt: { name: "createdAt" },
    },
  },
}));

// Import after mock to get the mocked version
import { operations, type HydraDatabase } from "@tambo-ai-cloud/db";
const mockOperations = operations as jest.Mocked<typeof operations>;

// Mock db type for testing - only implements the query methods used by V1Service
type MockDb = {
  query: {
    threads: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    messages: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
  };
};

describe("V1Service", () => {
  let service: V1Service;
  let mockDb: MockDb;

  const mockThread = {
    id: "thr_123",
    projectId: "prj_123",
    contextKey: "user_456",
    name: null,
    generationStage: GenerationStage.IDLE,
    runStatus: V1RunStatus.IDLE,
    currentRunId: null,
    statusMessage: null,
    lastRunCancelled: null,
    lastRunError: null,
    pendingToolCallIds: null,
    lastCompletedRunId: null,
    metadata: { key: "value" },
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  };

  const mockMessage = {
    id: "msg_123",
    threadId: "thr_123",
    role: "user",
    content: [{ type: ContentPartType.Text, text: "Hello" }],
    componentDecision: null,
    componentState: null,
    metadata: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
  };

  beforeEach(() => {
    mockDb = {
      query: {
        threads: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
        },
        messages: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
        },
      },
    };

    // Create service with mock database (cast to unknown first to satisfy constructor type)
    service = new V1Service(mockDb as unknown as HydraDatabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listThreads", () => {
    it("should list threads with default pagination", async () => {
      mockDb.query.threads.findMany.mockResolvedValue([mockThread]);

      const result = await service.listThreads("prj_123", undefined, {});

      expect(mockDb.query.threads.findMany).toHaveBeenCalled();
      expect(result.threads).toHaveLength(1);
      expect(result.threads[0].id).toBe("thr_123");
      expect(result.hasMore).toBe(false);
    });

    it("should filter by context key", async () => {
      mockDb.query.threads.findMany.mockResolvedValue([mockThread]);

      await service.listThreads("prj_123", "user_456", {});

      expect(mockDb.query.threads.findMany).toHaveBeenCalled();
    });

    it("should reject an empty context key", async () => {
      await expect(service.listThreads("prj_123", "", {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should handle pagination with cursor", async () => {
      mockDb.query.threads.findMany.mockResolvedValue([mockThread]);

      const cursor = encodeV1CompoundCursor({
        createdAt: new Date("2024-01-01T00:00:00Z"),
        id: "thr_000",
      });

      const result = await service.listThreads("prj_123", undefined, {
        cursor,
        limit: "10",
      });

      expect(mockDb.query.threads.findMany).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should reject an invalid cursor", async () => {
      await expect(
        service.listThreads("prj_123", undefined, { cursor: "not-a-cursor" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject an invalid limit", async () => {
      await expect(
        service.listThreads("prj_123", undefined, { limit: "not-a-number" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject an empty limit", async () => {
      await expect(
        service.listThreads("prj_123", undefined, { limit: "" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should indicate hasMore when more results exist", async () => {
      // Return 21 results when limit is 20 (default)
      const threads = Array(21)
        .fill(null)
        .map((_, i) => ({
          ...mockThread,
          id: `thr_${i}`,
          createdAt: new Date(
            `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
          ),
        }));
      mockDb.query.threads.findMany.mockResolvedValue(threads);

      const result = await service.listThreads("prj_123", undefined, {});

      expect(result.hasMore).toBe(true);
      expect(result.threads).toHaveLength(20);
      expect(result.nextCursor).toBeDefined();

      const cursor = parseV1CompoundCursor(result.nextCursor!);
      expect(cursor.createdAt.toISOString()).toBe(
        result.threads[result.threads.length - 1].createdAt,
      );
      expect(cursor.id).toBe(result.threads[result.threads.length - 1].id);
    });

    it("should include the id in nextCursor when createdAt ties", async () => {
      const t1 = {
        ...mockThread,
        id: "thr_b",
        createdAt: new Date("2024-01-02T00:00:00Z"),
      };
      const t2 = {
        ...mockThread,
        id: "thr_a",
        createdAt: new Date("2024-01-02T00:00:00Z"),
      };
      mockDb.query.threads.findMany.mockResolvedValue([t1, t2]);

      const result = await service.listThreads("prj_123", undefined, {
        limit: "1",
      });

      expect(result.hasMore).toBe(true);
      expect(parseV1CompoundCursor(result.nextCursor!).id).toBe("thr_b");
    });
  });

  describe("getThread", () => {
    it("should return thread with messages", async () => {
      mockDb.query.threads.findFirst.mockResolvedValue({
        ...mockThread,
        messages: [mockMessage],
      });

      const result = await service.getThread("thr_123");

      expect(result.id).toBe("thr_123");
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].id).toBe("msg_123");
    });

    it("should throw NotFoundException for non-existent thread", async () => {
      mockDb.query.threads.findFirst.mockResolvedValue(null);

      await expect(service.getThread("thr_nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should map V1 fields correctly", async () => {
      const threadWithV1Fields = {
        ...mockThread,
        runStatus: V1RunStatus.STREAMING,
        currentRunId: "run_123",
        statusMessage: "Processing...",
        pendingToolCallIds: ["call_1", "call_2"],
        lastCompletedRunId: "run_prev",
        messages: [],
      };
      mockDb.query.threads.findFirst.mockResolvedValue(threadWithV1Fields);

      const result = await service.getThread("thr_123");

      expect(result.runStatus).toBe(V1RunStatus.STREAMING);
      expect(result.currentRunId).toBe("run_123");
      expect(result.statusMessage).toBe("Processing...");
      expect(result.pendingToolCallIds).toEqual(["call_1", "call_2"]);
      expect(result.lastCompletedRunId).toBe("run_prev");
    });
  });

  describe("createThread", () => {
    it("should create a thread with minimal data", async () => {
      mockOperations.createThread.mockResolvedValue(mockThread);

      const result = await service.createThread("prj_123", undefined, {});

      expect(mockOperations.createThread).toHaveBeenCalledWith(mockDb, {
        projectId: "prj_123",
        contextKey: undefined,
        metadata: undefined,
      });
      expect(result.id).toBe("thr_123");
      expect(result.projectId).toBe("prj_123");
    });

    it("should create a thread with context key and metadata", async () => {
      mockOperations.createThread.mockResolvedValue({
        ...mockThread,
        contextKey: "user_456",
        metadata: { custom: "data" },
      });

      const result = await service.createThread("prj_123", "user_456", {
        metadata: { custom: "data" },
      });

      expect(result.contextKey).toBe("user_456");
      expect(result.metadata).toEqual({ custom: "data" });
    });

    it("should reject initialMessages for now", async () => {
      await expect(
        service.createThread("prj_123", undefined, {
          initialMessages: [
            { role: "user", content: [{ type: "text", text: "Hi" }] },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockOperations.createThread).not.toHaveBeenCalled();
    });
  });

  describe("deleteThread", () => {
    it("should delete an existing thread", async () => {
      mockOperations.deleteThread.mockResolvedValue(mockThread);

      await expect(service.deleteThread("thr_123")).resolves.not.toThrow();
    });

    it("should throw NotFoundException for non-existent thread", async () => {
      mockOperations.deleteThread.mockResolvedValue(
        null as unknown as typeof mockThread,
      );

      await expect(service.deleteThread("thr_nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("listMessages", () => {
    it("should list messages with default pagination", async () => {
      mockDb.query.messages.findMany.mockResolvedValue([mockMessage]);

      const result = await service.listMessages("thr_123", {});

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe("user");
      expect(result.hasMore).toBe(false);
    });

    it("should support ascending order (oldest first)", async () => {
      mockDb.query.messages.findMany.mockResolvedValue([mockMessage]);

      await service.listMessages("thr_123", { order: "asc" });

      expect(mockDb.query.messages.findMany).toHaveBeenCalled();
    });

    it("should support descending order (newest first)", async () => {
      mockDb.query.messages.findMany.mockResolvedValue([mockMessage]);

      await service.listMessages("thr_123", { order: "desc" });

      expect(mockDb.query.messages.findMany).toHaveBeenCalled();
    });

    it("should handle pagination with cursor", async () => {
      mockDb.query.messages.findMany.mockResolvedValue([mockMessage]);

      const cursor = encodeV1CompoundCursor({
        createdAt: new Date("2024-01-01T00:00:00Z"),
        id: "msg_000",
      });

      await service.listMessages("thr_123", {
        cursor,
        limit: "10",
      });

      expect(mockDb.query.messages.findMany).toHaveBeenCalled();
    });

    it("should reject an invalid cursor", async () => {
      await expect(
        service.listMessages("thr_123", { cursor: "not-a-cursor" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject an invalid limit", async () => {
      await expect(
        service.listMessages("thr_123", { limit: "not-a-number" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject an empty limit", async () => {
      await expect(
        service.listMessages("thr_123", { limit: "" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should set nextCursor for both asc and desc", async () => {
      const msg1 = {
        ...mockMessage,
        id: "msg_1",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };
      const msg2 = {
        ...mockMessage,
        id: "msg_2",
        createdAt: new Date("2024-01-02T00:00:00Z"),
      };
      const msg3 = {
        ...mockMessage,
        id: "msg_3",
        createdAt: new Date("2024-01-03T00:00:00Z"),
      };

      mockDb.query.messages.findMany.mockResolvedValueOnce([msg1, msg2, msg3]);
      const ascPage = await service.listMessages("thr_123", {
        limit: "2",
        order: "asc",
      });
      expect(ascPage.hasMore).toBe(true);
      expect(ascPage.messages).toHaveLength(2);
      expect(parseV1CompoundCursor(ascPage.nextCursor!).id).toBe("msg_2");

      mockDb.query.messages.findMany.mockResolvedValueOnce([msg3, msg2, msg1]);
      const descPage = await service.listMessages("thr_123", {
        limit: "2",
        order: "desc",
      });
      expect(descPage.hasMore).toBe(true);
      expect(descPage.messages).toHaveLength(2);
      expect(parseV1CompoundCursor(descPage.nextCursor!).id).toBe("msg_2");
    });
  });

  describe("getMessage", () => {
    it("should return a single message", async () => {
      mockDb.query.messages.findFirst.mockResolvedValue(mockMessage);

      const result = await service.getMessage("thr_123", "msg_123");

      expect(result.id).toBe("msg_123");
      expect(result.role).toBe("user");
    });

    it("should throw NotFoundException for non-existent message", async () => {
      mockDb.query.messages.findFirst.mockResolvedValue(null);

      await expect(
        service.getMessage("thr_123", "msg_nonexistent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("Content conversion", () => {
    it("should convert text content to V1 format", async () => {
      const messageWithText = {
        ...mockMessage,
        content: [{ type: "text", text: "Hello world" }],
      };
      mockDb.query.messages.findFirst.mockResolvedValue(messageWithText);

      const result = await service.getMessage("thr_123", "msg_123");

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: "Hello world",
      });
    });

    it("should convert resource content to V1 format", async () => {
      const messageWithResource = {
        ...mockMessage,
        content: [
          {
            type: "resource",
            resource: {
              uri: "https://example.com/file.pdf",
              mimeType: "application/pdf",
            },
          },
        ],
      };
      mockDb.query.messages.findFirst.mockResolvedValue(messageWithResource);

      const result = await service.getMessage("thr_123", "msg_123");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("resource");
    });

    it("should convert image_url content to resource format", async () => {
      const messageWithImage = {
        ...mockMessage,
        content: [
          {
            type: "image_url",
            image_url: { url: "https://example.com/image.png" },
          },
        ],
      };
      mockDb.query.messages.findFirst.mockResolvedValue(messageWithImage);

      const result = await service.getMessage("thr_123", "msg_123");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("resource");
    });

    it("should include component content block when componentDecision exists", async () => {
      const messageWithComponent = {
        ...mockMessage,
        content: [{ type: "text", text: "Here is a weather card" }],
        componentDecision: {
          componentName: "WeatherCard",
          props: { temperature: 72 },
        },
        componentState: { expanded: true },
      };
      mockDb.query.messages.findFirst.mockResolvedValue(messageWithComponent);

      const result = await service.getMessage("thr_123", "msg_123");

      expect(result.content).toHaveLength(2);
      const componentBlock = result.content.find((c) => c.type === "component");
      expect(componentBlock).toBeDefined();
      expect((componentBlock as any).name).toBe("WeatherCard");
      expect((componentBlock as any).props).toEqual({ temperature: 72 });
      expect((componentBlock as any).state).toEqual({ expanded: true });
    });

    it("should handle message with empty content array", async () => {
      const messageWithEmptyContent = { ...mockMessage, content: [] };
      mockDb.query.messages.findFirst.mockResolvedValue(
        messageWithEmptyContent,
      );

      const result = await service.getMessage("thr_123", "msg_123");

      expect(result.content).toEqual([]);
    });

    it("should skip unknown content types without error", async () => {
      const warnSpy = jest
        .spyOn(Logger.prototype, "warn")
        .mockImplementation(() => undefined);

      const messageWithUnknownContent = {
        ...mockMessage,
        content: [
          { type: "text", text: "Hello" },
          { type: "unknown_future_type", data: "something" },
          { type: "text", text: "World" },
        ],
      };
      mockDb.query.messages.findFirst.mockResolvedValue(
        messageWithUnknownContent,
      );

      const result = await service.getMessage("thr_123", "msg_123");

      // Unknown type is skipped, only text blocks remain
      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({ type: "text", text: "Hello" });
      expect(result.content[1]).toEqual({ type: "text", text: "World" });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown content part type"),
      );
      warnSpy.mockRestore();
    });

    it("should throw error when componentDecision has no componentName", async () => {
      const messageWithBadComponent = {
        ...mockMessage,
        content: [],
        componentDecision: {
          componentName: null,
          props: { foo: "bar" },
        },
      };
      mockDb.query.messages.findFirst.mockResolvedValue(
        messageWithBadComponent,
      );

      await expect(service.getMessage("thr_123", "msg_123")).rejects.toThrow(
        /Component decision in message msg_123 has no componentName/,
      );
    });
  });

  describe("Role mapping", () => {
    it("should map 'tool' role to 'assistant'", async () => {
      const messageWithToolRole = { ...mockMessage, role: "tool" };
      mockDb.query.messages.findFirst.mockResolvedValue(messageWithToolRole);

      const result = await service.getMessage("thr_123", "msg_123");

      expect(result.role).toBe("assistant");
    });

    it("should throw error for unknown role", async () => {
      const messageWithUnknownRole = { ...mockMessage, role: "invalid_role" };
      mockDb.query.messages.findFirst.mockResolvedValue(messageWithUnknownRole);

      await expect(service.getMessage("thr_123", "msg_123")).rejects.toThrow(
        /Unknown message role "invalid_role"/,
      );
    });
  });

  describe("Thread field mapping", () => {
    it("should map lastRunError correctly", async () => {
      const threadWithError = {
        ...mockThread,
        lastRunError: {
          code: "RATE_LIMITED",
          message: "Too many requests",
        },
        messages: [],
      };
      mockDb.query.threads.findFirst.mockResolvedValue(threadWithError);

      const result = await service.getThread("thr_123");

      expect(result.lastRunError).toEqual({
        code: "RATE_LIMITED",
        message: "Too many requests",
      });
    });
  });

  describe("createThread error handling", () => {
    it("should throw error if database returns null", async () => {
      mockOperations.createThread.mockResolvedValue(
        null as unknown as typeof mockThread,
      );

      await expect(
        service.createThread("prj_123", undefined, {}),
      ).rejects.toThrow(/Failed to create thread for project prj_123/);
    });
  });

  // Note: startRun and cancelRun tests require more complex DB mocking
  // (update, insert, returning) that would make these tests brittle.
  // These methods are better tested via integration tests that use a real DB.
  // The unit tests above cover the thread/message query operations.
});
