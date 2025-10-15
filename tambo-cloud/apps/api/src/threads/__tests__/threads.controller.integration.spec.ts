import { BadRequestException, INestApplication, Logger } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import {
  ContentPartType,
  GenerationStage,
  MessageRole,
} from "@tambo-ai-cloud/core";
import request from "supertest";
import { SentryExceptionFilter } from "../../common/filters/sentry-exception.filter";
import { extractContextInfo } from "../../common/utils/extract-context-info";
import { ApiKeyGuard } from "../../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../../projects/guards/bearer-token.guard";
import { ProjectAccessOwnGuard } from "../../projects/guards/project-access-own.guard";
import { AdvanceThreadDto } from "../dto/advance-thread.dto";
import { ThreadInProjectGuard } from "../guards/thread-in-project-guard";
import { ThreadsController } from "../threads.controller";
import { ThreadsService } from "../threads.service";

// Mock the ThreadsService module BEFORE any imports
jest.mock("../threads.service", () => ({
  ThreadsService: jest.fn().mockImplementation(() => ({
    advanceThread: jest.fn(),
  })),
}));

// Mock the extractContextInfo function
jest.mock("../../common/utils/extract-context-info");
const mockExtractContextInfo = extractContextInfo as jest.MockedFunction<
  typeof extractContextInfo
>;

describe("ThreadsController - Integration Tests (HTTP Response Format)", () => {
  let app: INestApplication;
  let threadsService: ThreadsService;

  const createValidAdvanceRequestDto = (): AdvanceThreadDto => ({
    messageToAppend: {
      content: [{ type: ContentPartType.Text, text: "test message" }],
      role: MessageRole.User,
    },
    contextKey: "test-context-key",
  });

  beforeEach(async () => {
    // Limit logger to warnings and errors to keep test output quiet
    Logger.overrideLogger(["error", "warn"]);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ThreadsController],
      providers: [
        {
          provide: ThreadsService,
          useValue: {
            advanceThread: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BearerTokenGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ProjectAccessOwnGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThreadInProjectGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(["error", "warn"]);

    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));

    await app.init();

    threadsService = moduleFixture.get<ThreadsService>(ThreadsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("Error Response Format", () => {
    let loggerErrorSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeAll(() => {
      // Suppress error logs only for this error-format test suite
      loggerErrorSpy = jest
        .spyOn(Logger.prototype, "error")
        .mockImplementation(() => {});
      consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
    });

    afterAll(() => {
      loggerErrorSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should return default NestJS JSON error format when extractContextInfo throws BadRequestException", async () => {
      // Arrange
      const testError = new BadRequestException("Project ID is required");
      const requestBody = createValidAdvanceRequestDto();

      mockExtractContextInfo.mockImplementation(() => {
        throw testError;
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post("/threads/test-thread-id/advancestream")
        .send(requestBody)
        .expect(400);

      // Should receive JSON response with default NestJS error format
      expect(response.headers["content-type"]).toMatch(/application\/json/);
      expect(response.body).toEqual({
        message: "Project ID is required",
        error: "Bad Request",
        statusCode: 400,
      });

      // Should NOT be HTML
      expect(response.text).not.toMatch(/<!DOCTYPE html>/);
      expect(response.text).not.toMatch(/<html>/);
    });

    it("should return default NestJS JSON error format for createAndAdvanceThreadStream endpoint", async () => {
      // Arrange
      const testError = new BadRequestException(
        "Context key cannot be provided both via API parameter and OAuth bearer token. Use only one method.",
      );
      const requestBody = createValidAdvanceRequestDto();

      mockExtractContextInfo.mockImplementation(() => {
        throw testError;
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post("/threads/advancestream")
        .send(requestBody)
        .expect(400);

      // Should receive JSON response with default NestJS error format
      expect(response.headers["content-type"]).toMatch(/application\/json/);
      expect(response.body).toEqual({
        message:
          "Context key cannot be provided both via API parameter and OAuth bearer token. Use only one method.",
        error: "Bad Request",
        statusCode: 400,
      });

      // Should NOT be HTML
      expect(response.text).not.toMatch(/<!DOCTYPE html>/);
      expect(response.text).not.toMatch(/<html>/);
    });

    it("should return default NestJS JSON error format for any generic BadRequestException", async () => {
      // Arrange
      const testError = new BadRequestException("Any validation error");
      const requestBody = createValidAdvanceRequestDto();

      mockExtractContextInfo.mockImplementation(() => {
        throw testError;
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post("/threads/advancestream")
        .send(requestBody)
        .expect(400);

      // Verify it's JSON, not HTML
      expect(response.headers["content-type"]).toMatch(/application\/json/);
      expect(response.body).toEqual({
        message: "Any validation error",
        error: "Bad Request",
        statusCode: 400,
      });

      // Ensure it's NOT HTML format
      expect(response.text).not.toMatch(/<!DOCTYPE html>/);
      expect(response.text).not.toMatch(/<html>/);
      expect(response.text).not.toMatch(/<pre>/);
      expect(response.text).not.toMatch(/Error:/);
    });
  });

  describe("Successful Response Format", () => {
    it("should successfully start stream when extractContextInfo works correctly", async () => {
      // Arrange
      const requestBody = createValidAdvanceRequestDto();

      mockExtractContextInfo.mockReturnValue({
        projectId: "test-project-id",
        contextKey: "test-context-key",
      });

      // Mock a successful stream response by pushing to the queue
      jest
        .spyOn(threadsService, "advanceThread")
        .mockImplementation(
          async (
            _projectId,
            _advanceRequestDto,
            _unresolvedThreadId,
            _stream,
            _toolCallCounts,
            _cachedSystemTools,
            queue,
          ) => {
            if (queue) {
              queue.push({
                responseMessageDto: {
                  id: "msg-1",
                  content: [{ type: ContentPartType.Text, text: "Hello" }],
                  role: MessageRole.Assistant,
                  threadId: "test-thread-id",
                  componentState: {},
                  createdAt: new Date(),
                },
                generationStage: GenerationStage.COMPLETE,
                mcpAccessToken: "test-mcp-access-token",
              });
              queue.finish();
            }
          },
        );

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post("/threads/test-thread-id/advancestream")
        .send(requestBody)
        .expect(201);

      // Should receive text/event-stream for successful streaming
      expect(response.headers["content-type"]).toContain("text/event-stream");
      expect(response.headers["cache-control"]).toContain("no-cache");
      expect(response.headers["connection"]).toContain("keep-alive");

      // Should contain stream data
      expect(response.text).toMatch(/data: /);
      expect(response.text).toMatch(/DONE/);
    });
  });
});
