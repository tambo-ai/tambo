import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  V1RunStatus,
  GenerationStage,
  MessageRole,
} from "@tambo-ai-cloud/core";
import { V1Service } from "../v1.service";
import {
  encodeV1CompoundCursor,
  parseV1CompoundCursor,
} from "../v1-pagination";

// Minimal mock for the subset of Sentry APIs exercised by `V1Service`.
jest.mock("@sentry/nestjs", () => ({
  startSpan: (_ctx: unknown, maybeCallback?: unknown, ..._rest: unknown[]) => {
    if (typeof maybeCallback === "function") {
      return maybeCallback();
    }
    return undefined;
  },
  setContext: jest.fn(),
  captureException: jest.fn(),
}));

// Mock the database operations module
jest.mock("@tambo-ai-cloud/db", () => ({
  operations: {
    createThread: jest.fn(),
    deleteThread: jest.fn(),
    getThreadForProjectId: jest.fn(),
    getThreadForRunStart: jest.fn(),
    acquireRunLock: jest.fn(),
    createRun: jest.fn(),
    setCurrentRunId: jest.fn(),
    getRun: jest.fn(),
    markRunCancelled: jest.fn(),
    releaseRunLockIfCurrent: jest.fn(),
    updateRunStatus: jest.fn(),
    updateThreadRunStatus: jest.fn(),
    completeRun: jest.fn(),
    updateMessage: jest.fn(),
    listThreadsPaginated: jest.fn(),
    listMessagesPaginated: jest.fn(),
    getMessageByIdInThread: jest.fn(),
  },
  schema: {
    threads: {
      id: { name: "id" },
      projectId: { name: "projectId" },
      contextKey: { name: "contextKey" },
      createdAt: { name: "createdAt" },
      runStatus: { name: "runStatus" },
    },
    messages: {
      id: { name: "id" },
      threadId: { name: "threadId" },
      createdAt: { name: "createdAt" },
      componentState: { name: "componentState" },
    },
    runs: {
      id: { name: "id" },
      threadId: { name: "threadId" },
    },
  },
}));

// Import after mock to get the mocked version
import { operations, type HydraDatabase } from "@tambo-ai-cloud/db";
const mockOperations = operations as jest.Mocked<typeof operations>;

// Mock db type for testing - only implements the query methods used by V1Service
type MockDb = {
  transaction: jest.Mock;
  query: {
    threads: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    messages: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    runs: {
      findFirst: jest.Mock;
    };
  };
  select: jest.Mock;
  // Chain mocks for update().set().where().returning()
  update: jest.Mock;
  // Chain mocks for insert().values().returning()
  insert: jest.Mock;
};

// Mock ThreadsService type for testing
type MockThreadsService = {
  advanceThread: jest.Mock;
};

describe("V1Service", () => {
  let service: V1Service;
  let mockDb: MockDb;
  let mockThreadsService: MockThreadsService;
  let mockSelectChain: {
    from: jest.Mock;
    where: jest.Mock;
    limit: jest.Mock;
    for: jest.Mock;
    execute: jest.Mock;
  };

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
    role: MessageRole.User,
    content: [{ type: "text" as const, text: "Hello" }],
    componentDecision: null,
    componentState: null,
    metadata: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    toolCallRequest: null,
    reasoning: null,
    reasoningDurationMS: null,
    parentMessageId: null,
    toolCallId: null,
    error: null,
    additionalContext: null,
    isCancelled: false,
    actionType: null,
    tokenUsage: null,
    llmModel: null,
    suggestions: [],
  };

  beforeEach(() => {
    // Create chain mock helpers for update().set().where().returning()
    const createUpdateChain = (returningValue: unknown[]) => {
      const returning = jest.fn().mockResolvedValue(returningValue);
      const where = jest.fn().mockReturnValue({ returning });
      const set = jest.fn().mockReturnValue({ where });
      return jest.fn().mockReturnValue({ set });
    };

    // Create chain mock helpers for insert().values().returning()
    const createInsertChain = (returningValue: unknown[]) => {
      const returning = jest.fn().mockResolvedValue(returningValue);
      const values = jest.fn().mockReturnValue({ returning });
      return jest.fn().mockReturnValue({ values });
    };

    mockDb = {
      transaction: jest.fn(),
      query: {
        threads: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
        },
        messages: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
        },
        runs: {
          findFirst: jest.fn(),
        },
      },
      select: jest.fn(),
      update: createUpdateChain([{ id: "thr_123" }]),
      insert: createInsertChain([{ id: "run_123" }]),
    };

    mockSelectChain = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      for: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    mockDb.select.mockReturnValue(mockSelectChain);

    mockDb.transaction.mockImplementation(async (handler) => {
      return await handler(mockDb as unknown as HydraDatabase);
    });

    mockThreadsService = {
      advanceThread: jest.fn(),
    };

    // Create service with mock database and threads service (cast to unknown first to satisfy constructor type)
    service = new V1Service(
      mockDb as unknown as HydraDatabase,
      mockThreadsService as unknown as import("../../threads/threads.service").ThreadsService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listThreads", () => {
    it("should list threads with default pagination", async () => {
      mockOperations.listThreadsPaginated.mockResolvedValue([mockThread]);

      const result = await service.listThreads("prj_123", "user_456", {});

      expect(mockOperations.listThreadsPaginated).toHaveBeenCalledWith(
        mockDb,
        "prj_123",
        "user_456",
        { cursor: undefined, limit: 21 },
      );
      expect(result.threads).toHaveLength(1);
      expect(result.threads[0].id).toBe("thr_123");
      expect(result.hasMore).toBe(false);
    });

    it("should clamp negative limits", async () => {
      mockOperations.listThreadsPaginated.mockResolvedValue([]);

      await service.listThreads("prj_123", "user_456", { limit: -5 } as any);

      const normalizedLimit = 1;

      expect(mockOperations.listThreadsPaginated).toHaveBeenCalledWith(
        mockDb,
        "prj_123",
        "user_456",
        { cursor: undefined, limit: normalizedLimit + 1 },
      );
    });

    it("should clamp large limits to 100", async () => {
      mockOperations.listThreadsPaginated.mockResolvedValue([]);

      await service.listThreads("prj_123", "user_456", { limit: 1000 } as any);

      const normalizedLimit = 100;

      expect(mockOperations.listThreadsPaginated).toHaveBeenCalledWith(
        mockDb,
        "prj_123",
        "user_456",
        { cursor: undefined, limit: normalizedLimit + 1 },
      );
    });

    it("should throw for non-finite limits", async () => {
      await expect(
        service.listThreads("prj_123", "user_456", { limit: NaN } as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.listThreads("prj_123", "user_456", {
          limit: Number.POSITIVE_INFINITY,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw for non-integer limits", async () => {
      await expect(
        service.listThreads("prj_123", "user_456", { limit: 2.5 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should filter by context key", async () => {
      mockOperations.listThreadsPaginated.mockResolvedValue([mockThread]);

      await service.listThreads("prj_123", "user_456", {});

      expect(mockOperations.listThreadsPaginated).toHaveBeenCalledWith(
        mockDb,
        "prj_123",
        "user_456",
        expect.any(Object),
      );
    });

    // Note: Empty context key validation is now handled at the controller level

    it("should handle pagination with cursor", async () => {
      mockOperations.listThreadsPaginated.mockResolvedValue([mockThread]);

      const cursor = encodeV1CompoundCursor({
        createdAt: new Date("2024-01-01T00:00:00Z"),
        id: "thr_000",
      });

      const result = await service.listThreads("prj_123", "user_456", {
        cursor,
        limit: 10,
      });

      expect(mockOperations.listThreadsPaginated).toHaveBeenCalledWith(
        mockDb,
        "prj_123",
        "user_456",
        {
          cursor: {
            createdAt: new Date("2024-01-01T00:00:00Z"),
            id: "thr_000",
          },
          limit: 11,
        },
      );
      expect(result).toBeDefined();
    });

    it("should reject an invalid cursor", async () => {
      await expect(
        service.listThreads("prj_123", "user_456", { cursor: "not-a-cursor" }),
      ).rejects.toThrow(BadRequestException);
    });

    // Note: Invalid limit validation is now handled at the DTO layer via class-validator

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
      mockOperations.listThreadsPaginated.mockResolvedValue(threads);

      const result = await service.listThreads("prj_123", "user_456", {});

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
      mockOperations.listThreadsPaginated.mockResolvedValue([t1, t2]);

      const result = await service.listThreads("prj_123", "user_456", {
        limit: 1,
      });

      expect(result.hasMore).toBe(true);
      expect(parseV1CompoundCursor(result.nextCursor!).id).toBe("thr_b");
    });
  });

  describe("getThread", () => {
    it("should return thread with messages", async () => {
      mockOperations.getThreadForProjectId.mockResolvedValue({
        ...mockThread,
        messages: [mockMessage],
      });

      const result = await service.getThread("thr_123", "prj_123", "user_456");

      expect(mockOperations.getThreadForProjectId).toHaveBeenCalledWith(
        mockDb,
        "thr_123",
        "prj_123",
        "user_456",
        true,
      );
      expect(result.id).toBe("thr_123");
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].id).toBe("msg_123");
    });

    it("should throw NotFoundException for non-existent thread", async () => {
      mockOperations.getThreadForProjectId.mockResolvedValue(undefined);

      await expect(
        service.getThread("thr_nonexistent", "prj_123", "user_456"),
      ).rejects.toThrow(NotFoundException);
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
      mockOperations.getThreadForProjectId.mockResolvedValue(
        threadWithV1Fields,
      );

      const result = await service.getThread("thr_123", "prj_123", "user_456");

      expect(result.runStatus).toBe(V1RunStatus.STREAMING);
      expect(result.currentRunId).toBe("run_123");
      expect(result.statusMessage).toBe("Processing...");
      expect(result.pendingToolCallIds).toEqual(["call_1", "call_2"]);
      expect(result.lastCompletedRunId).toBe("run_prev");
    });

    it("should pass contextKey to operation when provided", async () => {
      mockOperations.getThreadForProjectId.mockResolvedValue({
        ...mockThread,
        messages: [],
      });

      await service.getThread("thr_123", "prj_123", "user_456");

      expect(mockOperations.getThreadForProjectId).toHaveBeenCalledWith(
        mockDb,
        "thr_123",
        "prj_123",
        "user_456",
        true,
      );
    });
  });

  describe("createThread", () => {
    it("should create a thread with minimal data", async () => {
      mockOperations.createThread.mockResolvedValue(mockThread);

      const result = await service.createThread("prj_123", "user_456", {});

      expect(mockOperations.createThread).toHaveBeenCalledWith(mockDb, {
        projectId: "prj_123",
        contextKey: "user_456",
        metadata: undefined,
      });
      expect(result.id).toBe("thr_123");
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

      expect(result.userKey).toBe("user_456");
      expect(result.metadata).toEqual({ custom: "data" });
    });

    it("should reject initialMessages for now", async () => {
      await expect(
        service.createThread("prj_123", "user_456", {
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
      mockOperations.listMessagesPaginated.mockResolvedValue([mockMessage]);

      const result = await service.listMessages("thr_123", {});

      // fetchLimit = (effectiveLimit + 1) * 2 = (50 + 1) * 2 = 102
      expect(mockOperations.listMessagesPaginated).toHaveBeenCalledWith(
        mockDb,
        "thr_123",
        { cursor: undefined, limit: 102, order: "asc" },
      );
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe("user");
      expect(result.hasMore).toBe(false);
    });

    it("should support ascending order (oldest first)", async () => {
      mockOperations.listMessagesPaginated.mockResolvedValue([mockMessage]);

      await service.listMessages("thr_123", { order: "asc" });

      expect(mockOperations.listMessagesPaginated).toHaveBeenCalledWith(
        mockDb,
        "thr_123",
        expect.objectContaining({ order: "asc" }),
      );
    });

    it("should support descending order (newest first)", async () => {
      mockOperations.listMessagesPaginated.mockResolvedValue([mockMessage]);

      await service.listMessages("thr_123", { order: "desc" });

      expect(mockOperations.listMessagesPaginated).toHaveBeenCalledWith(
        mockDb,
        "thr_123",
        expect.objectContaining({ order: "desc" }),
      );
    });

    it("should handle pagination with cursor", async () => {
      mockOperations.listMessagesPaginated.mockResolvedValue([mockMessage]);

      const cursor = encodeV1CompoundCursor({
        createdAt: new Date("2024-01-01T00:00:00Z"),
        id: "msg_000",
      });

      await service.listMessages("thr_123", {
        cursor,
        limit: 10,
      });

      // fetchLimit = (limit + 1) * 2 = (10 + 1) * 2 = 22
      expect(mockOperations.listMessagesPaginated).toHaveBeenCalledWith(
        mockDb,
        "thr_123",
        {
          cursor: {
            createdAt: new Date("2024-01-01T00:00:00Z"),
            id: "msg_000",
          },
          limit: 22,
          order: "asc",
        },
      );
    });

    it("should reject an invalid cursor", async () => {
      await expect(
        service.listMessages("thr_123", { cursor: "not-a-cursor" }),
      ).rejects.toThrow(BadRequestException);
    });

    // Note: Invalid limit validation is now handled at the DTO layer via class-validator

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

      mockOperations.listMessagesPaginated.mockResolvedValueOnce([
        msg1,
        msg2,
        msg3,
      ]);
      const ascPage = await service.listMessages("thr_123", {
        limit: 2,
        order: "asc",
      });
      expect(ascPage.hasMore).toBe(true);
      expect(ascPage.messages).toHaveLength(2);
      expect(parseV1CompoundCursor(ascPage.nextCursor!).id).toBe("msg_2");

      mockOperations.listMessagesPaginated.mockResolvedValueOnce([
        msg3,
        msg2,
        msg1,
      ]);
      const descPage = await service.listMessages("thr_123", {
        limit: 2,
        order: "desc",
      });
      expect(descPage.hasMore).toBe(true);
      expect(descPage.messages).toHaveLength(2);
      expect(parseV1CompoundCursor(descPage.nextCursor!).id).toBe("msg_2");
    });
  });

  describe("getMessage", () => {
    it("should return a single message", async () => {
      mockOperations.getMessageByIdInThread.mockResolvedValue(mockMessage);

      const result = await service.getMessage("thr_123", "msg_123");

      expect(mockOperations.getMessageByIdInThread).toHaveBeenCalledWith(
        mockDb,
        "thr_123",
        "msg_123",
      );
      expect(result.id).toBe("msg_123");
      expect(result.role).toBe("user");
    });

    it("should throw NotFoundException for non-existent message", async () => {
      mockOperations.getMessageByIdInThread.mockResolvedValue(undefined);

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
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithText as any,
      );

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
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithResource as any,
      );

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
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithImage as any,
      );

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
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithComponent as any,
      );

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
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithEmptyContent as any,
      );

      const result = await service.getMessage("thr_123", "msg_123");

      expect(result.content).toEqual([]);
    });

    it("should convert tool role messages to tool_result content blocks", async () => {
      const toolMessage = {
        ...mockMessage,
        role: "tool",
        content: [{ type: "text", text: '{"temperature": 72, "unit": "F"}' }],
        toolCallId: "call_xyz789",
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        toolMessage as any,
      );

      const result = await service.getMessage("thr_123", "msg_123");

      // Role should be mapped to assistant
      expect(result.role).toBe("assistant");
      // Content should be a single tool_result block
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("tool_result");
      const toolResultBlock = result.content[0] as any;
      expect(toolResultBlock.toolUseId).toBe("call_xyz789");
      expect(toolResultBlock.content).toHaveLength(1);
      expect(toolResultBlock.content[0]).toEqual({
        type: "text",
        text: '{"temperature": 72, "unit": "F"}',
      });
    });

    it("should hide tool messages with componentDecision.componentName (UI tool responses)", async () => {
      // Tool messages with componentDecision.componentName are UI tool responses
      // (show_component_* tools) and should be hidden from the API.
      // They return 404 to indicate they're not accessible.
      const toolMessageWithComponent = {
        ...mockMessage,
        role: "tool",
        content: [{ type: "text", text: "Component was rendered" }],
        componentDecision: {
          componentName: "WeatherCard",
          props: { temperature: 72 },
        },
        toolCallId: "call_xyz789",
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        toolMessageWithComponent as any,
      );

      // UI tool responses are hidden and return 404
      await expect(service.getMessage("thr_123", "msg_123")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should include tool_use content block when toolCallRequest exists", async () => {
      const messageWithToolCall = {
        ...mockMessage,
        role: "assistant",
        content: [{ type: "text", text: "Let me fetch the weather" }],
        toolCallRequest: {
          toolName: "getWeather",
          parameters: [
            { parameterName: "location", parameterValue: "San Francisco" },
            { parameterName: "unit", parameterValue: "celsius" },
          ],
        },
        toolCallId: "call_abc123",
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithToolCall as any,
      );

      const result = await service.getMessage("thr_123", "msg_123");

      expect(result.content).toHaveLength(2);
      const toolUseBlock = result.content.find((c) => c.type === "tool_use");
      expect(toolUseBlock).toBeDefined();
      expect((toolUseBlock as any).id).toBe("call_abc123");
      expect((toolUseBlock as any).name).toBe("getWeather");
      expect((toolUseBlock as any).input).toEqual({
        location: "San Francisco",
        unit: "celsius",
      });
    });

    it("should not include tool_use block when toolCallId is missing", async () => {
      const messageWithToolCallNoId = {
        ...mockMessage,
        role: "assistant",
        content: [{ type: "text", text: "Let me fetch the weather" }],
        toolCallRequest: {
          toolName: "getWeather",
          parameters: [
            { parameterName: "location", parameterValue: "San Francisco" },
          ],
        },
        toolCallId: null,
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithToolCallNoId as any,
      );

      const result = await service.getMessage("thr_123", "msg_123");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
    });

    it("should include _tambo_* status params in tool_use input from componentDecision", async () => {
      const messageWithToolCallAndStatus = {
        ...mockMessage,
        role: "assistant",
        content: [{ type: "text", text: "Let me fetch the weather" }],
        toolCallRequest: {
          toolName: "getWeather",
          parameters: [
            { parameterName: "location", parameterValue: "San Francisco" },
          ],
        },
        toolCallId: "call_abc123",
        componentDecision: {
          componentName: null, // Not a UI tool
          props: {},
          message: "Fetching weather data",
          statusMessage: "Getting weather for San Francisco...",
          completionStatusMessage: "Got weather for San Francisco",
        },
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithToolCallAndStatus as any,
      );

      const result = await service.getMessage("thr_123", "msg_123");

      const toolUseBlock = result.content.find((c) => c.type === "tool_use");
      expect(toolUseBlock).toBeDefined();
      expect((toolUseBlock as any).input).toEqual({
        location: "San Francisco",
        _tambo_statusMessage: "Getting weather for San Francisco...",
        _tambo_completionStatusMessage: "Got weather for San Francisco",
        _tambo_displayMessage: "Fetching weather data",
      });
    });

    it("should not include _tambo_* params when componentDecision is missing", async () => {
      const messageWithToolCallNoDecision = {
        ...mockMessage,
        role: "assistant",
        content: [{ type: "text", text: "Let me fetch the weather" }],
        toolCallRequest: {
          toolName: "getWeather",
          parameters: [{ parameterName: "location", parameterValue: "NYC" }],
        },
        toolCallId: "call_xyz789",
        componentDecision: null,
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithToolCallNoDecision as any,
      );

      const result = await service.getMessage("thr_123", "msg_123");

      const toolUseBlock = result.content.find((c) => c.type === "tool_use");
      expect(toolUseBlock).toBeDefined();
      expect((toolUseBlock as any).input).toEqual({
        location: "NYC",
      });
      expect((toolUseBlock as any).input._tambo_statusMessage).toBeUndefined();
    });

    it("should skip empty displayMessage in tool_use input", async () => {
      const messageWithEmptyDisplayMessage = {
        ...mockMessage,
        role: "assistant",
        content: [{ type: "text", text: "Let me fetch the weather" }],
        toolCallRequest: {
          toolName: "getWeather",
          parameters: [{ parameterName: "location", parameterValue: "LA" }],
        },
        toolCallId: "call_empty",
        componentDecision: {
          componentName: null,
          props: {},
          message: "   ", // Whitespace-only message
          statusMessage: "Getting weather...",
          componentState: null,
        },
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithEmptyDisplayMessage as any,
      );

      const result = await service.getMessage("thr_123", "msg_123");

      const toolUseBlock = result.content.find((c) => c.type === "tool_use");
      expect((toolUseBlock as any).input).toEqual({
        location: "LA",
        _tambo_statusMessage: "Getting weather...",
      });
      // Empty/whitespace displayMessage should NOT be included
      expect((toolUseBlock as any).input._tambo_displayMessage).toBeUndefined();
    });

    it("should NOT include tool_use block for show_component_* UI tools", async () => {
      // UI tool calls (show_component_*) should not generate tool_use blocks
      // as they're internal implementation details
      const messageWithUiToolCall = {
        ...mockMessage,
        role: "assistant",
        content: [{ type: "text", text: "Here's the weather" }],
        toolCallRequest: {
          toolName: "show_component_WeatherCard",
          parameters: [{ parameterName: "temperature", parameterValue: 72 }],
        },
        toolCallId: "call_ui_123",
        componentDecision: {
          componentName: "WeatherCard",
          props: { temperature: 72 },
        },
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithUiToolCall as any,
      );

      const result = await service.getMessage("thr_123", "msg_123");

      // Should have text and component blocks, but NO tool_use block
      expect(result.content.find((c) => c.type === "text")).toBeDefined();
      expect(result.content.find((c) => c.type === "component")).toBeDefined();
      expect(result.content.find((c) => c.type === "tool_use")).toBeUndefined();
    });

    it("should skip unknown content types without error", async () => {
      const warnSpy = jest
        .spyOn(Logger.prototype, "warn")
        .mockImplementation(() => undefined);

      const messageWithUnknownContent = {
        ...mockMessage,
        content: [
          { type: "text" as const, text: "Hello" },
          { type: "unknown_future_type", data: "something" },
          { type: "text" as const, text: "World" },
        ],
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithUnknownContent as any,
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

    it("should warn when componentDecision has no componentName and no toolCallRequest", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const messageWithBadComponent = {
        ...mockMessage,
        content: [{ type: "text", text: "Hello" }],
        componentDecision: {
          componentName: null,
          props: { foo: "bar" },
        },
        toolCallRequest: null, // No tool call - this is a data integrity issue
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithBadComponent as any,
      );

      // Should succeed but log a warning
      const result = await service.getMessage("thr_123", "msg_123");
      expect(result).toBeDefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /Component decision in message msg_123 has no componentName/,
        ),
      );

      warnSpy.mockRestore();
    });
  });

  describe("UI tool response filtering", () => {
    it("should throw NotFoundException for getMessage when message is a UI tool response", async () => {
      const uiToolResponseMessage = {
        ...mockMessage,
        id: "msg_ui_tool",
        role: "tool",
        content: [{ type: "text", text: "Component was rendered" }],
        toolCallId: "call_ui_123",
        componentDecision: {
          componentName: "AirQualityCard",
          props: { city: "NYC" },
        },
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        uiToolResponseMessage as any,
      );

      await expect(
        service.getMessage("thr_123", "msg_ui_tool"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should filter out UI tool responses from listMessages", async () => {
      const regularMessage = {
        ...mockMessage,
        id: "msg_regular",
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
      };
      const uiToolResponseMessage = {
        ...mockMessage,
        id: "msg_ui_tool",
        role: "tool",
        content: [{ type: "text", text: "Component was rendered" }],
        toolCallId: "call_ui_123",
        componentDecision: {
          componentName: "AirQualityCard",
          props: { city: "NYC" },
        },
      };
      mockOperations.listMessagesPaginated.mockResolvedValue([
        regularMessage,
        uiToolResponseMessage,
      ] as any);

      const result = await service.listMessages("thr_123", {});

      // Should only return the regular message, not the UI tool response
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].id).toBe("msg_regular");
    });

    it("should filter out UI tool responses from getThread messages", async () => {
      const regularMessage = {
        ...mockMessage,
        id: "msg_regular",
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
      };
      const uiToolResponseMessage = {
        ...mockMessage,
        id: "msg_ui_tool",
        role: "tool",
        content: [{ type: "text", text: "Component was rendered" }],
        toolCallId: "call_ui_123",
        componentDecision: {
          componentName: "AirQualityCard",
          props: { city: "NYC" },
        },
      };
      const mockThread = {
        id: "thr_123",
        projectId: "proj_123",
        contextKey: "user_123",
        runStatus: "idle",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [regularMessage, uiToolResponseMessage],
      };
      mockOperations.getThreadForProjectId.mockResolvedValue(mockThread as any);

      const result = await service.getThread("thr_123", "proj_123", "user_123");

      // Should only return the regular message, not the UI tool response
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].id).toBe("msg_regular");
    });

    it("should NOT filter regular tool responses (non-UI tool)", async () => {
      const regularToolResponse = {
        ...mockMessage,
        id: "msg_tool",
        role: "tool",
        content: [{ type: "text", text: "Weather is sunny" }],
        toolCallId: "call_regular_123",
        componentDecision: null, // No componentDecision or null componentName
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        regularToolResponse as any,
      );

      // Should NOT throw - regular tool responses are visible
      const result = await service.getMessage("thr_123", "msg_tool");
      expect(result.id).toBe("msg_tool");
    });

    it("should NOT filter tool responses with componentDecision but no componentName", async () => {
      const toolResponseNoComponentName = {
        ...mockMessage,
        id: "msg_tool_no_name",
        role: "tool",
        content: [{ type: "text", text: "Some result" }],
        toolCallId: "call_123",
        componentDecision: {
          componentName: null, // Explicitly null
          props: {},
        },
      };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        toolResponseNoComponentName as any,
      );

      // Should NOT throw - componentName is null, so this is visible
      const result = await service.getMessage("thr_123", "msg_tool_no_name");
      expect(result.id).toBe("msg_tool_no_name");
    });

    it("should correctly determine hasMore when many hidden messages exist", async () => {
      // Create a scenario where user requests limit=3, but many hidden messages exist
      // This tests that we fetch enough messages and correctly set hasMore
      const visibleMessage1 = {
        ...mockMessage,
        id: "msg_visible_1",
        role: "assistant",
        content: [{ type: "text", text: "Hello 1" }],
        createdAt: new Date("2024-01-01T00:00:01Z"),
      };
      const hiddenMessage1 = {
        ...mockMessage,
        id: "msg_hidden_1",
        role: "tool",
        content: [{ type: "text", text: "Component rendered" }],
        toolCallId: "call_ui_1",
        componentDecision: { componentName: "Card", props: {} },
        createdAt: new Date("2024-01-01T00:00:02Z"),
      };
      const hiddenMessage2 = {
        ...mockMessage,
        id: "msg_hidden_2",
        role: "tool",
        content: [{ type: "text", text: "Component rendered" }],
        toolCallId: "call_ui_2",
        componentDecision: { componentName: "Card", props: {} },
        createdAt: new Date("2024-01-01T00:00:03Z"),
      };
      const visibleMessage2 = {
        ...mockMessage,
        id: "msg_visible_2",
        role: "assistant",
        content: [{ type: "text", text: "Hello 2" }],
        createdAt: new Date("2024-01-01T00:00:04Z"),
      };
      const hiddenMessage3 = {
        ...mockMessage,
        id: "msg_hidden_3",
        role: "tool",
        content: [{ type: "text", text: "Component rendered" }],
        toolCallId: "call_ui_3",
        componentDecision: { componentName: "Card", props: {} },
        createdAt: new Date("2024-01-01T00:00:05Z"),
      };
      const visibleMessage3 = {
        ...mockMessage,
        id: "msg_visible_3",
        role: "assistant",
        content: [{ type: "text", text: "Hello 3" }],
        createdAt: new Date("2024-01-01T00:00:06Z"),
      };
      const visibleMessage4 = {
        ...mockMessage,
        id: "msg_visible_4",
        role: "assistant",
        content: [{ type: "text", text: "Hello 4" }],
        createdAt: new Date("2024-01-01T00:00:07Z"),
      };

      // Mock returns 7 messages (3 hidden, 4 visible)
      mockOperations.listMessagesPaginated.mockResolvedValue([
        visibleMessage1,
        hiddenMessage1,
        hiddenMessage2,
        visibleMessage2,
        hiddenMessage3,
        visibleMessage3,
        visibleMessage4,
      ] as any);

      // Request limit=3
      const result = await service.listMessages("thr_123", { limit: 3 });

      // Should return exactly 3 visible messages
      expect(result.messages).toHaveLength(3);
      expect(result.messages.map((m) => m.id)).toEqual([
        "msg_visible_1",
        "msg_visible_2",
        "msg_visible_3",
      ]);

      // hasMore should be true because there's a 4th visible message
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });

    it("should set hasMore=false when all visible messages fit in limit", async () => {
      const visibleMessage1 = {
        ...mockMessage,
        id: "msg_visible_1",
        role: "assistant",
        content: [{ type: "text", text: "Hello 1" }],
      };
      const hiddenMessage1 = {
        ...mockMessage,
        id: "msg_hidden_1",
        role: "tool",
        content: [{ type: "text", text: "Component rendered" }],
        toolCallId: "call_ui_1",
        componentDecision: { componentName: "Card", props: {} },
      };
      const visibleMessage2 = {
        ...mockMessage,
        id: "msg_visible_2",
        role: "assistant",
        content: [{ type: "text", text: "Hello 2" }],
      };

      // Mock returns 3 messages (1 hidden, 2 visible)
      mockOperations.listMessagesPaginated.mockResolvedValue([
        visibleMessage1,
        hiddenMessage1,
        visibleMessage2,
      ] as any);

      // Request limit=3 (more than visible count)
      const result = await service.listMessages("thr_123", { limit: 3 });

      // Should return 2 visible messages
      expect(result.messages).toHaveLength(2);

      // hasMore should be false - we have fewer visible messages than the limit
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe("Role mapping", () => {
    it("should map 'tool' role to 'assistant'", async () => {
      const messageWithToolRole = { ...mockMessage, role: "tool" };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithToolRole as any,
      );

      const result = await service.getMessage("thr_123", "msg_123");

      expect(result.role).toBe("assistant");
    });

    it("should throw error for unknown role", async () => {
      const messageWithUnknownRole = { ...mockMessage, role: "invalid_role" };
      mockOperations.getMessageByIdInThread.mockResolvedValue(
        messageWithUnknownRole as any,
      );

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
      mockOperations.getThreadForProjectId.mockResolvedValue(threadWithError);

      const result = await service.getThread("thr_123", "prj_123", "user_456");

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
        service.createThread("prj_123", "user_456", {}),
      ).rejects.toThrow(/Failed to create thread for project prj_123/);
    });
  });

  describe("startRun", () => {
    it("should return error when thread not found", async () => {
      mockOperations.getThreadForRunStart.mockResolvedValue({
        thread: null,
        hasMessages: false,
      });

      const result = await service.startRun("thr_nonexistent", {
        message: { role: "user", content: [{ type: "text", text: "Hi" }] },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.getStatus()).toBe(404);
        const response = result.error.getResponse() as { type?: string };
        expect(response.type).toContain("thread_not_found");
      }
    });

    it("should require previousRunId when thread has existing messages", async () => {
      mockOperations.getThreadForRunStart.mockResolvedValue({
        thread: {
          ...mockThread,
          lastCompletedRunId: "run_prev",
        },
        hasMessages: true,
      });

      const result = await service.startRun("thr_123", {
        message: { role: "user", content: [{ type: "text", text: "Hi" }] },
        // No previousRunId provided
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.getStatus()).toBe(400);
        const response = result.error.getResponse() as {
          type?: string;
          detail?: string;
        };
        expect(response.type).toContain("invalid_previous_run");
        expect(response.detail).toContain("previousRunId is required");
      }
    });

    it("should reject mismatched previousRunId", async () => {
      mockOperations.getThreadForRunStart.mockResolvedValue({
        thread: {
          ...mockThread,
          lastCompletedRunId: "run_actual_last",
        },
        hasMessages: true,
      });

      const result = await service.startRun("thr_123", {
        message: { role: "user", content: [{ type: "text", text: "Hi" }] },
        previousRunId: "run_wrong_id",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.getStatus()).toBe(400);
        const response = result.error.getResponse() as {
          type?: string;
          detail?: string;
        };
        expect(response.type).toContain("invalid_previous_run");
        expect(response.detail).toContain("does not match");
      }
    });

    it("should return conflict when run already active", async () => {
      mockOperations.getThreadForRunStart.mockResolvedValue({
        thread: {
          ...mockThread,
          runStatus: V1RunStatus.STREAMING,
          currentRunId: "run_active",
        },
        hasMessages: false,
      });
      mockOperations.acquireRunLock.mockResolvedValue(false);

      const result = await service.startRun("thr_123", {
        message: { role: "user", content: [{ type: "text", text: "Hi" }] },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.getStatus()).toBe(409);
        const response = result.error.getResponse() as { type?: string };
        expect(response.type).toContain("concurrent_run");
      }

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      expect(mockOperations.createRun).not.toHaveBeenCalled();
    });

    it("should successfully start run on idle thread", async () => {
      mockOperations.getThreadForRunStart.mockResolvedValue({
        thread: {
          ...mockThread,
          runStatus: V1RunStatus.IDLE,
        },
        hasMessages: false,
      });
      mockOperations.acquireRunLock.mockResolvedValue(true);
      mockOperations.createRun.mockResolvedValue({ id: "run_new" });

      const result = await service.startRun("thr_123", {
        message: { role: "user", content: [{ type: "text", text: "Hi" }] },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.runId).toBe("run_new");
        expect(result.threadId).toBe("thr_123");
      }

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      expect(mockOperations.acquireRunLock).toHaveBeenCalledTimes(1);
      expect(mockOperations.createRun).toHaveBeenCalledTimes(1);
      expect(mockOperations.setCurrentRunId).toHaveBeenCalledTimes(1);
    });

    it("should allow previousRunId on thread with messages", async () => {
      mockOperations.getThreadForRunStart.mockResolvedValue({
        thread: {
          ...mockThread,
          lastCompletedRunId: "run_prev",
          runStatus: V1RunStatus.IDLE,
        },
        hasMessages: true,
      });
      mockOperations.acquireRunLock.mockResolvedValue(true);
      mockOperations.createRun.mockResolvedValue({ id: "run_new" });

      const result = await service.startRun("thr_123", {
        message: { role: "user", content: [{ type: "text", text: "Hi" }] },
        previousRunId: "run_prev", // Matches lastCompletedRunId
      });

      expect(result.success).toBe(true);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      expect(mockOperations.acquireRunLock).toHaveBeenCalledTimes(1);
      expect(mockOperations.createRun).toHaveBeenCalledTimes(1);
      expect(mockOperations.setCurrentRunId).toHaveBeenCalledTimes(1);
    });
  });

  describe("executeRun", () => {
    const createMockResponse = () => ({
      write: jest.fn(),
    });

    const setupAdvanceThreadMock = () => {
      mockThreadsService.advanceThread.mockImplementation(
        async (
          _projectId,
          _advanceRequest,
          _threadId,
          _toolCallCounts,
          _cached,
          queue,
        ) => {
          queue.finish();
        },
      );
      mockOperations.releaseRunLockIfCurrent.mockResolvedValue(true);
    };

    const mockRunDtoBase = {
      message: {
        role: "user",
        content: [{ type: "text" as const, text: "Hi" }],
      },
      tools: [],
      availableComponents: [],
    };

    it("should pass additionalContext through to threadsService.advanceThread", async () => {
      setupAdvanceThreadMock();

      const response = createMockResponse();

      const additionalContext = {
        currentPage: "/dashboard",
        userPreferences: { theme: "dark" },
        nestedObject: { deeply: { nested: { value: 123 } } },
      };

      await service.executeRun(
        response as any,
        "thr_123",
        "run_123",
        {
          ...mockRunDtoBase,
          message: {
            ...mockRunDtoBase.message,
            additionalContext,
          },
        } as any,
        "prj_123",
        "user_456",
      );

      expect(mockThreadsService.advanceThread).toHaveBeenCalledTimes(1);
      const advanceRequest = mockThreadsService.advanceThread.mock.calls[0][1];
      expect(advanceRequest.messageToAppend.additionalContext).toEqual(
        additionalContext,
      );
      expect(response.write).toHaveBeenCalled();
    });

    it("should work without additionalContext", async () => {
      setupAdvanceThreadMock();

      const response = createMockResponse();

      await service.executeRun(
        response as any,
        "thr_123",
        "run_123",
        mockRunDtoBase as any,
        "prj_123",
        "user_456",
      );

      expect(mockThreadsService.advanceThread).toHaveBeenCalledTimes(1);
      const advanceRequest = mockThreadsService.advanceThread.mock.calls[0][1];
      expect(advanceRequest.messageToAppend.additionalContext).toBeUndefined();
      expect(response.write).toHaveBeenCalled();
    });

    it("should write a RUN_ERROR event when streaming fails", async () => {
      mockOperations.releaseRunLockIfCurrent.mockResolvedValue(true);
      mockThreadsService.advanceThread.mockImplementation(
        async (
          _projectId,
          _advanceRequest,
          _threadId,
          _toolCallCounts,
          _cached,
          queue,
        ) => {
          queue.finish();
          throw new Error("boom");
        },
      );

      const response = createMockResponse();

      await expect(
        service.executeRun(
          response as any,
          "thr_123",
          "run_123",
          mockRunDtoBase as any,
          "prj_123",
          "user_456",
        ),
      ).rejects.toThrow("boom");

      const writes = response.write.mock.calls.map(([value]) => `${value}`);
      expect(writes.some((w) => w.includes('"type":"RUN_ERROR"'))).toBe(true);
    });

    it("should write a RUN_ERROR event when the queue fails", async () => {
      mockOperations.releaseRunLockIfCurrent.mockResolvedValue(true);
      mockThreadsService.advanceThread.mockImplementation(
        async (
          _projectId,
          _advanceRequest,
          _threadId,
          _toolCallCounts,
          _cached,
          queue,
        ) => {
          queue.fail(new Error("boom-early"));
        },
      );

      const response = createMockResponse();

      await expect(
        service.executeRun(
          response as any,
          "thr_123",
          "run_123",
          mockRunDtoBase as any,
          "prj_123",
          "user_456",
        ),
      ).rejects.toThrow("boom-early");

      const writes = response.write.mock.calls.map(([value]) => `${value}`);
      expect(writes.some((w) => w.includes('"type":"RUN_ERROR"'))).toBe(true);
    });
  });

  describe("cancelRun", () => {
    it("should throw NotFoundException for non-existent run", async () => {
      mockOperations.getRun.mockResolvedValue(null);

      await expect(
        service.cancelRun("thr_123", "run_nonexistent", "user_cancelled"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when the run is no longer active", async () => {
      mockOperations.getRun.mockResolvedValue({
        id: "run_123",
        threadId: "thr_123",
        status: V1RunStatus.STREAMING,
      } as any);
      mockOperations.releaseRunLockIfCurrent.mockResolvedValue(false);

      await expect(
        service.cancelRun("thr_123", "run_123", "user_cancelled"),
      ).rejects.toThrow(NotFoundException);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      expect(mockOperations.markRunCancelled).not.toHaveBeenCalled();
    });

    it("should successfully cancel an existing run", async () => {
      mockOperations.getRun.mockResolvedValue({
        id: "run_123",
        threadId: "thr_123",
        status: V1RunStatus.STREAMING,
      } as any);
      mockOperations.releaseRunLockIfCurrent.mockResolvedValue(true);
      mockOperations.markRunCancelled.mockResolvedValue(undefined);

      const result = await service.cancelRun(
        "thr_123",
        "run_123",
        "user_cancelled",
      );

      expect(result.runId).toBe("run_123");
      expect(result.status).toBe("cancelled");

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      expect(mockOperations.releaseRunLockIfCurrent).toHaveBeenCalledTimes(1);
      expect(mockOperations.markRunCancelled).toHaveBeenCalledTimes(1);
    });
  });

  describe("Component State", () => {
    const mockMessageWithComponent = {
      id: "msg_123",
      threadId: "thr_123",
      role: MessageRole.Assistant,
      content: [
        {
          type: "component",
          id: "comp_123",
          name: "DataTable",
          props: { title: "Users" },
        },
      ],
      componentState: { loading: false, rows: [] },
      createdAt: new Date(),
      toolCallRequest: null,
      reasoning: null,
      reasoningDurationMS: null,
      parentMessageId: null,
      componentDecision: null,
      tokenUsage: null,
      llmModel: null,
      llmModelLabel: null,
      mcpToolCallRequest: null,
      mcpToolResponses: null,
      finishReason: null,
      additionalContext: null,
      error: null,
      metadata: null,
      isCancelled: false,
      llmRunId: null,
      updatedAt: new Date(),
      actionType: null,
      toolCallId: null,
    };

    describe("updateComponentState", () => {
      it("should throw NotFoundException when thread not found", async () => {
        // First execute: thread row lock
        mockSelectChain.execute.mockResolvedValueOnce([]);

        await expect(
          service.updateComponentState("thr_nonexistent", "comp_123", {
            state: { loading: true },
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it("should throw ConflictException when thread has active run", async () => {
        // First execute: thread row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "thr_123",
            runStatus: V1RunStatus.STREAMING,
          },
        ]);

        const promise = service.updateComponentState("thr_123", "comp_123", {
          state: { loading: true },
        });

        await expect(promise).rejects.toThrow(ConflictException);

        try {
          await promise;
        } catch (error: unknown) {
          if (error instanceof ConflictException) {
            const response = error.getResponse() as {
              detail?: string;
              type?: string;
            };
            expect(response.detail).toContain(
              "Cannot update component state while a run is active",
            );
            expect(response.type).toContain("run_active");
          }
        }
      });

      it("should throw NotFoundException when component not found", async () => {
        // First execute: thread row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "thr_123",
            runStatus: V1RunStatus.IDLE,
          },
        ]);

        // Second execute: message row lock
        mockSelectChain.execute.mockResolvedValueOnce([]);

        await expect(
          service.updateComponentState("thr_123", "comp_nonexistent", {
            state: { loading: true },
          }),
        ).rejects.toThrow("Component comp_nonexistent not found");

        expect(mockSelectChain.for).toHaveBeenCalledWith("update");
      });

      it("should throw HttpException when stored componentState is invalid", async () => {
        // First execute: thread row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "thr_123",
            runStatus: V1RunStatus.IDLE,
          },
        ]);

        // Second execute: message row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "msg_123",
            componentState: [],
          },
        ]);

        const error = (await service
          .updateComponentState("thr_123", "comp_123", {
            state: { loading: true },
          })
          .catch((caught) => caught)) as HttpException | unknown;

        expect(error).toBeInstanceOf(HttpException);

        if (error instanceof HttpException) {
          expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);

          const response = error.getResponse() as {
            detail?: string;
            type?: string;
          };

          expect(response.detail).toContain(
            "Stored component state is invalid",
          );
          expect(response.type).toContain("internal_error");
        }

        expect(mockOperations.updateMessage).not.toHaveBeenCalled();
        expect(mockSelectChain.for).toHaveBeenCalledWith("update");
      });

      it("should update state with full replacement", async () => {
        // First execute: thread row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "thr_123",
            runStatus: V1RunStatus.IDLE,
          },
        ]);

        // Second execute: message row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "msg_123",
            componentState: { loading: false, rows: [] },
          },
        ]);
        mockOperations.updateMessage.mockResolvedValue(
          mockMessageWithComponent as any,
        );

        const result = await service.updateComponentState(
          "thr_123",
          "comp_123",
          {
            state: { loading: true, rows: [{ id: 1 }] },
          },
        );

        expect(result.state).toEqual({ loading: true, rows: [{ id: 1 }] });
        expect(mockOperations.updateMessage).toHaveBeenCalledWith(
          mockDb,
          "msg_123",
          {
            componentState: { loading: true, rows: [{ id: 1 }] },
          },
        );
        expect(mockSelectChain.for).toHaveBeenCalledWith("update");
      });

      it("should update state with JSON Patch", async () => {
        // Mock message with initial state: { loading: false, rows: [] }
        // First execute: thread row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "thr_123",
            runStatus: V1RunStatus.IDLE,
          },
        ]);

        // Second execute: message row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "msg_123",
            componentState: { loading: false, rows: [] },
          },
        ]);
        mockOperations.updateMessage.mockResolvedValue(
          mockMessageWithComponent as any,
        );

        const result = await service.updateComponentState(
          "thr_123",
          "comp_123",
          {
            patch: [
              { op: "replace", path: "/loading", value: true },
              { op: "add", path: "/rows/-", value: { id: 1, name: "Alice" } },
            ],
          },
        );

        expect(result.state).toEqual({
          loading: true,
          rows: [{ id: 1, name: "Alice" }],
        });
        expect(mockDb.select).toHaveBeenCalled();
        expect(mockOperations.updateMessage).toHaveBeenCalled();
        expect(mockSelectChain.for).toHaveBeenCalledWith("update");
      });

      it("should throw BadRequestException for invalid JSON Patch", async () => {
        // First execute: thread row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "thr_123",
            runStatus: V1RunStatus.IDLE,
          },
        ]);

        // Second execute: message row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "msg_123",
            componentState: { loading: false, rows: [] },
          },
        ]);

        await expect(
          service.updateComponentState("thr_123", "comp_123", {
            patch: [{ op: "replace", path: "/nonexistent", value: true }],
          }),
        ).rejects.toThrow(BadRequestException);

        expect(mockSelectChain.for).toHaveBeenCalledWith("update");
      });

      it("should throw BadRequestException when neither state nor patch provided", async () => {
        // First execute: thread row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "thr_123",
            runStatus: V1RunStatus.IDLE,
          },
        ]);

        const error = (await service
          .updateComponentState("thr_123", "comp_123", {})
          .catch((caught) => caught)) as BadRequestException | unknown;

        expect(error).toBeInstanceOf(BadRequestException);

        if (error instanceof BadRequestException) {
          const response = error.getResponse() as {
            detail?: string;
            type?: string;
          };
          expect(response.detail).toContain("Either 'state' or 'patch'");
          expect(response.type).toContain("validation_error");
        }
      });

      it("should throw BadRequestException when both state and patch are provided", async () => {
        // First execute: thread row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "thr_123",
            runStatus: V1RunStatus.IDLE,
          },
        ]);

        const error = (await service
          .updateComponentState("thr_123", "comp_123", {
            state: { loading: true },
            patch: [{ op: "replace", path: "/loading", value: false }],
          })
          .catch((caught) => caught)) as BadRequestException | unknown;

        expect(error).toBeInstanceOf(BadRequestException);

        if (error instanceof BadRequestException) {
          const response = error.getResponse() as {
            detail?: string;
            type?: string;
          };
          expect(response.detail).toContain("not both");
          expect(response.type).toContain("validation_error");
        }

        expect(mockOperations.updateMessage).not.toHaveBeenCalled();
      });

      it("should throw BadRequestException when patch is an empty array", async () => {
        // First execute: thread row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "thr_123",
            runStatus: V1RunStatus.IDLE,
          },
        ]);

        const error = (await service
          .updateComponentState("thr_123", "comp_123", { patch: [] })
          .catch((caught) => caught)) as BadRequestException | unknown;

        expect(error).toBeInstanceOf(BadRequestException);

        if (error instanceof BadRequestException) {
          const response = error.getResponse() as {
            detail?: string;
            type?: string;
          };
          expect(response.detail).toContain("must not be empty");
          expect(response.type).toContain("validation_error");
        }

        expect(mockOperations.updateMessage).not.toHaveBeenCalled();
      });

      it("should handle empty state in component", async () => {
        const messageWithNoState = {
          ...mockMessageWithComponent,
          componentState: null,
        };
        // First execute: thread row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "thr_123",
            runStatus: V1RunStatus.IDLE,
          },
        ]);

        // Second execute: message row lock
        mockSelectChain.execute.mockResolvedValueOnce([
          {
            id: "msg_123",
            componentState: null,
          },
        ]);
        mockOperations.updateMessage.mockResolvedValue(
          messageWithNoState as any,
        );

        const result = await service.updateComponentState(
          "thr_123",
          "comp_123",
          {
            state: { loading: true },
          },
        );

        expect(result.state).toEqual({ loading: true });
        expect(mockSelectChain.for).toHaveBeenCalledWith("update");
      });
    });
  });
});
