import {
  BadRequestException,
  ExecutionContext,
  InternalServerErrorException,
} from "@nestjs/common";
import {
  type HydraDatabase,
  operations,
  ThreadNotFoundError,
} from "@tambo-ai-cloud/db";
import { Request } from "express";
import { type CorrelationLoggerService } from "../../common/services/logger.service";
import { ProjectId } from "../../projects/guards/apikey.guard";
import { ContextKey } from "../../projects/guards/bearer-token.guard";
import { V1ThreadInProjectGuard } from "../guards/v1-thread-in-project-guard";

jest.mock("@tambo-ai-cloud/db", () => {
  const actual =
    jest.requireActual<typeof import("@tambo-ai-cloud/db")>(
      "@tambo-ai-cloud/db",
    );
  return {
    ...actual,
    operations: {
      ensureThreadByProjectId: jest.fn(),
    },
  };
});

const mockEnsureThreadByProjectId =
  operations.ensureThreadByProjectId as jest.MockedFunction<
    typeof operations.ensureThreadByProjectId
  >;

function createMockExecutionContext(
  overrides: {
    params?: Record<string, string>;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
    projectId?: string;
    contextKey?: string;
  } = {},
): ExecutionContext {
  const request = {
    params: overrides.params ?? {},
    query: overrides.query ?? {},
    body: overrides.body ?? {},
    [ProjectId]: overrides.projectId,
    [ContextKey]: overrides.contextKey,
  } as unknown as Request;

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe("V1ThreadInProjectGuard", () => {
  let guard: V1ThreadInProjectGuard;

  type LoggerStub = Pick<CorrelationLoggerService, "log" | "warn" | "error">;

  const mockLogger: jest.Mocked<LoggerStub> = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const mockDb = {} as unknown as HydraDatabase;

  beforeEach(() => {
    guard = new V1ThreadInProjectGuard(
      mockDb,
      mockLogger as unknown as CorrelationLoggerService,
    );
    mockEnsureThreadByProjectId.mockClear();
    mockLogger.log.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
  });

  it("should allow access with bearer token contextKey", async () => {
    mockEnsureThreadByProjectId.mockResolvedValue(undefined);

    const context = createMockExecutionContext({
      params: { threadId: "thr_123" },
      projectId: "prj_123",
      contextKey: "oauth:user:alice",
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockEnsureThreadByProjectId).toHaveBeenCalledWith(
      mockDb,
      "thr_123",
      "prj_123",
      "oauth:user:alice",
    );
  });

  it("should allow access with query userKey", async () => {
    mockEnsureThreadByProjectId.mockResolvedValue(undefined);

    const context = createMockExecutionContext({
      params: { threadId: "thr_123" },
      query: { userKey: "user_456" },
      projectId: "prj_123",
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockEnsureThreadByProjectId).toHaveBeenCalledWith(
      mockDb,
      "thr_123",
      "prj_123",
      "user_456",
    );
  });

  it("should allow access with body userKey", async () => {
    mockEnsureThreadByProjectId.mockResolvedValue(undefined);

    const context = createMockExecutionContext({
      params: { threadId: "thr_123" },
      body: { userKey: "user_789" },
      projectId: "prj_123",
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockEnsureThreadByProjectId).toHaveBeenCalledWith(
      mockDb,
      "thr_123",
      "prj_123",
      "user_789",
    );
  });

  it("should prefer query userKey over body userKey", async () => {
    mockEnsureThreadByProjectId.mockResolvedValue(undefined);

    const context = createMockExecutionContext({
      params: { threadId: "thr_123" },
      query: { userKey: "query_user" },
      body: { userKey: "body_user" },
      projectId: "prj_123",
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockEnsureThreadByProjectId).toHaveBeenCalledWith(
      mockDb,
      "thr_123",
      "prj_123",
      "query_user",
    );
  });

  it("should throw BadRequestException when both userKey and bearer token are provided", async () => {
    const context = createMockExecutionContext({
      params: { threadId: "thr_123" },
      query: { userKey: "param_user" },
      projectId: "prj_123",
      contextKey: "oauth:user:bearer",
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw BadRequestException when no userKey or contextKey", async () => {
    const context = createMockExecutionContext({
      params: { threadId: "thr_123" },
      projectId: "prj_123",
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw BadRequestException for empty string userKey", async () => {
    const context = createMockExecutionContext({
      params: { threadId: "thr_123" },
      query: { userKey: "" },
      projectId: "prj_123",
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should return false when thread not found", async () => {
    mockEnsureThreadByProjectId.mockRejectedValue(
      new ThreadNotFoundError("thr_nonexistent", "prj_123"),
    );

    const context = createMockExecutionContext({
      params: { threadId: "thr_nonexistent" },
      projectId: "prj_123",
      contextKey: "oauth:user:alice",
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });

  it("should return false when threadId is missing", async () => {
    const context = createMockExecutionContext({
      params: {},
      projectId: "prj_123",
      contextKey: "oauth:user:alice",
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });

  it("should throw InternalServerErrorException when projectId is missing", async () => {
    const context = createMockExecutionContext({
      params: { threadId: "thr_123" },
      contextKey: "oauth:user:alice",
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Missing project ID in request: should be set by ApiKeyGuard",
    );
  });

  it("should throw BadRequestException for whitespace-only userKey", async () => {
    const context = createMockExecutionContext({
      params: { threadId: "thr_123" },
      query: { userKey: "   " },
      projectId: "prj_123",
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should rethrow unexpected errors", async () => {
    mockEnsureThreadByProjectId.mockRejectedValue(
      new Error("Database connection failed"),
    );

    const context = createMockExecutionContext({
      params: { threadId: "thr_123" },
      projectId: "prj_123",
      contextKey: "oauth:user:alice",
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      "Database connection failed",
    );
  });

  it("should ignore non-string query userKey values", async () => {
    const context = createMockExecutionContext({
      params: { threadId: "thr_123" },
      query: { userKey: ["array", "value"] },
      projectId: "prj_123",
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should support thread_id param name", async () => {
    mockEnsureThreadByProjectId.mockResolvedValue(undefined);

    const context = createMockExecutionContext({
      params: { thread_id: "thr_123" },
      projectId: "prj_123",
      contextKey: "oauth:user:alice",
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockEnsureThreadByProjectId).toHaveBeenCalledWith(
      mockDb,
      "thr_123",
      "prj_123",
      "oauth:user:alice",
    );
  });
});
