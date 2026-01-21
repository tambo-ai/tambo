import { HttpStatus, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { V1Service } from "./v1.service";
import { ThreadsService } from "../threads/threads.service";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import {
  createMockDBThread,
  createMockDBMessage,
} from "@tambo-ai-cloud/testing";
import { MessageRole, ContentPartType } from "@tambo-ai-cloud/core";

// Mock the operations module at the top level while preserving schema
const mockGetThreadForRunStart = jest.fn();
const mockDeleteThread = jest.fn();

jest.mock("@tambo-ai-cloud/db", () => {
  const actual =
    jest.requireActual<typeof import("@tambo-ai-cloud/db")>(
      "@tambo-ai-cloud/db",
    );
  return {
    ...actual,
    operations: {
      ...actual.operations,
      getThreadForRunStart: (...args: unknown[]) =>
        mockGetThreadForRunStart(...args),
      deleteThread: (...args: unknown[]) => mockDeleteThread(...args),
    },
  };
});

/**
 * V1 Service Integration Tests
 *
 * Tests the V1 service with mocked database, verifying:
 * - Thread CRUD operations
 * - Run lifecycle (start, execute, cancel)
 * - Tool result validation
 * - Concurrent run prevention
 */
describe("V1Service Integration", () => {
  let service: V1Service;
  let mockDb: {
    query: {
      threads: { findFirst: jest.Mock; findMany: jest.Mock };
      messages: { findFirst: jest.Mock; findMany: jest.Mock };
    };
    transaction: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let mockThreadsService: { advanceThread: jest.Mock };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    mockDb = {
      query: {
        threads: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        messages: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
      },
      transaction: jest.fn((fn) => fn(mockDb)),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    mockThreadsService = {
      advanceThread: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V1Service,
        {
          provide: DATABASE,
          useValue: mockDb,
        },
        {
          provide: ThreadsService,
          useValue: mockThreadsService,
        },
      ],
    }).compile();

    service = module.get<V1Service>(V1Service);
  });

  describe("Thread Operations", () => {
    describe("getThread", () => {
      it("returns thread with messages when found", async () => {
        const mockThread = createMockDBThread("thread_123", "project_123");
        const mockMessages = [
          createMockDBMessage("msg_1", "thread_123", MessageRole.User, [
            { type: ContentPartType.Text, text: "Hello" },
          ]),
          createMockDBMessage("msg_2", "thread_123", MessageRole.Assistant, [
            { type: ContentPartType.Text, text: "Hi there!" },
          ]),
        ];

        mockDb.query.threads.findFirst.mockResolvedValue({
          ...mockThread,
          messages: mockMessages,
        });

        const result = await service.getThread("thread_123");

        expect(result.id).toBe("thread_123");
        expect(result.messages).toHaveLength(2);
        expect(result.messages[0].content[0]).toEqual({
          type: "text",
          text: "Hello",
        });
      });

      it("throws NotFoundException when thread not found", async () => {
        mockDb.query.threads.findFirst.mockResolvedValue(null);

        await expect(service.getThread("nonexistent")).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe("listThreads", () => {
      it("returns paginated threads", async () => {
        const mockThreads = [
          createMockDBThread("thread_1", "project_123"),
          createMockDBThread("thread_2", "project_123"),
        ];
        mockDb.query.threads.findMany.mockResolvedValue(mockThreads);

        const result = await service.listThreads("project_123", undefined, {});

        expect(result.threads).toHaveLength(2);
        expect(result.hasMore).toBe(false);
      });

      it("indicates hasMore when more results exist", async () => {
        // Return 21 threads (limit is 20 by default)
        const mockThreads = Array.from({ length: 21 }, (_, i) =>
          createMockDBThread(`thread_${i}`, "project_123"),
        );
        mockDb.query.threads.findMany.mockResolvedValue(mockThreads);

        const result = await service.listThreads("project_123", undefined, {});

        expect(result.threads).toHaveLength(20);
        expect(result.hasMore).toBe(true);
        expect(result.nextCursor).toBeDefined();
      });
    });

    describe("deleteThread", () => {
      it("deletes thread successfully", async () => {
        const mockThread = createMockDBThread("thread_123", "project_123");
        mockDeleteThread.mockResolvedValue(mockThread);

        // deleteThread returns void on success
        await expect(
          service.deleteThread("thread_123"),
        ).resolves.toBeUndefined();
        expect(mockDeleteThread).toHaveBeenCalledWith(mockDb, "thread_123");
      });

      it("throws NotFoundException when thread not found", async () => {
        mockDeleteThread.mockResolvedValue(null);

        await expect(service.deleteThread("nonexistent")).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe("Run Lifecycle", () => {
    describe("startRun", () => {
      it("returns error when thread not found", async () => {
        mockGetThreadForRunStart.mockResolvedValue({
          thread: null,
          hasMessages: false,
        });

        const result = await service.startRun("nonexistent", {
          message: {
            role: "user",
            content: [{ type: "text" as const, text: "hello" }],
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.getStatus()).toBe(HttpStatus.NOT_FOUND);
        }
      });

      it("requires previousRunId when thread has messages", async () => {
        const mockThread = createMockDBThread("thread_123", "project_123");

        mockGetThreadForRunStart.mockResolvedValue({
          thread: mockThread,
          hasMessages: true,
        });

        const result = await service.startRun("thread_123", {
          message: {
            role: "user",
            content: [{ type: "text" as const, text: "hello" }],
          },
          // Missing previousRunId
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
          const response = result.error.getResponse() as { type: string };
          expect(response.type).toContain("invalid_previous_run");
        }
      });

      it("validates previousRunId matches lastCompletedRunId", async () => {
        const mockThread = createMockDBThread(
          "thread_123",
          "project_123",
          undefined,
          {
            lastCompletedRunId: "run_correct",
          },
        );

        mockGetThreadForRunStart.mockResolvedValue({
          thread: mockThread,
          hasMessages: true,
        });

        const result = await service.startRun("thread_123", {
          message: {
            role: "user",
            content: [{ type: "text" as const, text: "hello" }],
          },
          previousRunId: "run_wrong", // Doesn't match
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        }
      });
    });
  });

  describe("Tool Result Validation", () => {
    it("validates all pending tool calls have results", async () => {
      const mockThread = createMockDBThread(
        "thread_123",
        "project_123",
        undefined,
        {
          pendingToolCallIds: ["call_1", "call_2"],
          lastCompletedRunId: "run_previous",
        },
      );

      mockGetThreadForRunStart.mockResolvedValue({
        thread: mockThread,
        hasMessages: true,
      });

      // Only provide result for call_1, missing call_2
      const result = await service.startRun("thread_123", {
        message: {
          role: "user",
          content: [
            {
              type: "tool_result" as const,
              toolUseId: "call_1",
              content: [{ type: "text" as const, text: "result" }],
            },
          ],
        },
        previousRunId: "run_previous",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        const response = result.error.getResponse() as { type: string };
        expect(response.type).toContain("invalid_tool_result");
      }
    });

    it("rejects extra tool results not in pending list", async () => {
      const mockThread = createMockDBThread(
        "thread_123",
        "project_123",
        undefined,
        {
          pendingToolCallIds: ["call_1"],
          lastCompletedRunId: "run_previous",
        },
      );

      mockGetThreadForRunStart.mockResolvedValue({
        thread: mockThread,
        hasMessages: true,
      });

      // Provide result for unknown call_999
      const result = await service.startRun("thread_123", {
        message: {
          role: "user",
          content: [
            {
              type: "tool_result" as const,
              toolUseId: "call_1",
              content: [{ type: "text" as const, text: "result" }],
            },
            {
              type: "tool_result" as const,
              toolUseId: "call_999", // Not in pending list
              content: [{ type: "text" as const, text: "extra result" }],
            },
          ],
        },
        previousRunId: "run_previous",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });

  describe("Message Operations", () => {
    describe("listMessages", () => {
      it("returns paginated messages", async () => {
        const mockMessages = [
          createMockDBMessage("msg_1", "thread_123", MessageRole.User, [
            { type: ContentPartType.Text, text: "Hello" },
          ]),
        ];
        mockDb.query.messages.findMany.mockResolvedValue(mockMessages);

        const result = await service.listMessages("thread_123", {});

        expect(result.messages).toHaveLength(1);
        expect(result.hasMore).toBe(false);
      });

      it("supports ascending and descending order", async () => {
        mockDb.query.messages.findMany.mockResolvedValue([]);

        await service.listMessages("thread_123", { order: "asc" });
        await service.listMessages("thread_123", { order: "desc" });

        expect(mockDb.query.messages.findMany).toHaveBeenCalledTimes(2);
      });
    });

    describe("getMessage", () => {
      it("returns message when found", async () => {
        const mockMessage = createMockDBMessage(
          "msg_1",
          "thread_123",
          MessageRole.User,
          [{ type: ContentPartType.Text, text: "Hello" }],
        );
        mockDb.query.messages.findFirst.mockResolvedValue(mockMessage);

        const result = await service.getMessage("thread_123", "msg_1");

        expect(result.id).toBe("msg_1");
        expect(result.role).toBe("user");
      });

      it("throws NotFoundException when message not found", async () => {
        mockDb.query.messages.findFirst.mockResolvedValue(null);

        await expect(
          service.getMessage("thread_123", "nonexistent"),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});
