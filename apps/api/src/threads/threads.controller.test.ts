jest.mock("./threads.service", () => ({
  ThreadsService: jest.fn().mockImplementation(() => ({
    advanceThread: jest.fn(),
  })),
}));

jest.mock("../common/utils/extract-context-info");

import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ContentPartType, MessageRole } from "@tambo-ai-cloud/core";
import { Request, Response } from "express";
import { extractContextInfo } from "../common/utils/extract-context-info";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";
import { ProjectAccessOwnGuard } from "../projects/guards/project-access-own.guard";
import { AdvanceThreadDto } from "./dto/advance-thread.dto";
import { ThreadInProjectGuard } from "./guards/thread-in-project-guard";
import { ThreadsController } from "./threads.controller";
import { ThreadsService } from "./threads.service";
import { EndpointDeprecatedException } from "./types/errors";

const mockExtractContextInfo = extractContextInfo as jest.MockedFunction<
  typeof extractContextInfo
>;

const expectEndpointDeprecatedProblem = (
  error: unknown,
  {
    requestUrl,
    migrateToEndpoint,
    detail,
  }: { requestUrl: string; migrateToEndpoint: string; detail: string },
) => {
  expect(error).toBeInstanceOf(EndpointDeprecatedException);
  const endpointDeprecatedError = error as EndpointDeprecatedException;

  expect(endpointDeprecatedError.getStatus()).toBe(410);
  expect(endpointDeprecatedError.getResponse()).toEqual({
    type: "https://docs.tambo.co/api-reference/problems/endpoint-deprecated",
    status: 410,
    title: "Endpoint Deprecated",
    detail,
    code: "ENDPOINT_DEPRECATED",
    instance: requestUrl,
    details: {
      migrateToEndpoint,
    },
  });
};

describe("ThreadsController - Stream Routes Error Propagation", () => {
  let controller: ThreadsController;
  let threadsService: ThreadsService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const createValidAdvanceRequestDto = (): AdvanceThreadDto => ({
    messageToAppend: {
      content: [{ type: ContentPartType.Text, text: "test message" }],
      role: MessageRole.User,
    },
    contextKey: "test-context-key",
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    controller = module.get<ThreadsController>(ThreadsController);
    threadsService = module.get<ThreadsService>(ThreadsService);

    // Set up mock request and response
    mockRequest = { url: "/threads/test/advancestream" };
    mockResponse = {
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("POST /:id/advancestream", () => {
    it("should propagate errors from extractContextInfo to the caller", async () => {
      // Arrange
      const threadId = "test-thread-id";
      const advanceRequestDto = createValidAdvanceRequestDto();
      const testError = new BadRequestException(
        "Any error from extractContextInfo",
      );

      mockExtractContextInfo.mockImplementation(() => {
        throw testError;
      });

      // Act & Assert - The error should be thrown to the caller
      await expect(
        controller.advanceThreadStream(
          threadId,
          mockRequest as Request,
          advanceRequestDto,
          mockResponse as Response,
        ),
      ).rejects.toThrow(testError);

      // The service should not be called when extractContextInfo fails
      expect(threadsService.advanceThread).not.toHaveBeenCalled();
    });

    it("should handle errors from advanceThread and write to stream", async () => {
      // Arrange
      const threadId = "test-thread-id";
      const advanceRequestDto = createValidAdvanceRequestDto();
      const internalError = new Error("Internal service error");

      mockExtractContextInfo.mockReturnValue({
        projectId: "test-project-id",
        contextKey: "test-context-key",
      });

      // Mock advanceThread to fail the queue with an error
      jest
        .spyOn(threadsService, "advanceThread")
        .mockImplementation(
          async (
            _projectId,
            _advanceRequestDto,
            _unresolvedThreadId,
            _toolCallCounts,
            _cachedSystemTools,
            queue,
          ) => {
            if (queue) {
              queue.fail(internalError);
            }
          },
        );

      // Act - The method should handle the error internally via the queue
      await controller.advanceThreadStream(
        threadId,
        mockRequest as Request,
        advanceRequestDto,
        mockResponse as Response,
      );

      // Assert - Error should be written to stream response
      expect(mockResponse.write).toHaveBeenCalledWith(
        "error: Error in streaming response\n\n",
      );
      for (const [message] of (mockResponse.write as jest.Mock).mock.calls) {
        expect(message).not.toContain(internalError.message);
      }
      expect(mockResponse.end).toHaveBeenCalled();
      expect(threadsService.advanceThread).toHaveBeenCalled();
    });
  });

  describe("POST /advancestream", () => {
    it("should propagate errors from extractContextInfo to the caller", async () => {
      // Arrange
      const advanceRequestDto = createValidAdvanceRequestDto();
      const testError = new BadRequestException(
        "Any error from extractContextInfo",
      );

      mockExtractContextInfo.mockImplementation(() => {
        throw testError;
      });

      // Act & Assert - The error should be thrown to the caller
      await expect(
        controller.createAndAdvanceThreadStream(
          mockRequest as Request,
          advanceRequestDto,
          mockResponse as Response,
        ),
      ).rejects.toThrow(testError);

      // The service should not be called when extractContextInfo fails
      expect(threadsService.advanceThread).not.toHaveBeenCalled();
    });

    it("should handle errors from advanceThread and write to stream", async () => {
      // Arrange
      const advanceRequestDto = createValidAdvanceRequestDto();
      const internalError = new Error("Internal service error");

      mockExtractContextInfo.mockReturnValue({
        projectId: "test-project-id",
        contextKey: "test-context-key",
      });

      // Mock advanceThread to fail the queue with an error
      jest
        .spyOn(threadsService, "advanceThread")
        .mockImplementation(
          async (
            _projectId,
            _advanceRequestDto,
            _unresolvedThreadId,
            _toolCallCounts,
            _cachedSystemTools,
            queue,
          ) => {
            if (queue) {
              queue.fail(internalError);
            }
          },
        );

      // Act - The method should handle the error internally via the queue
      await controller.createAndAdvanceThreadStream(
        mockRequest as Request,
        advanceRequestDto,
        mockResponse as Response,
      );

      // Assert - Error should be written to stream response
      expect(mockResponse.write).toHaveBeenCalledWith(
        "error: Error in streaming response\n\n",
      );
      for (const [message] of (mockResponse.write as jest.Mock).mock.calls) {
        expect(message).not.toContain(internalError.message);
      }
      expect(mockResponse.end).toHaveBeenCalled();
      expect(threadsService.advanceThread).toHaveBeenCalled();
    });
  });

  describe("POST /:id/advance (deprecated)", () => {
    it("should return 410 Gone with deprecation error", async () => {
      // Arrange
      const threadId = "test-thread-id";
      const request = { url: `/threads/${threadId}/advance` } as Request;

      // Act & Assert - The deprecated endpoint should throw EndpointDeprecatedException
      await expect(
        controller.advanceThread(threadId, request, {} as any),
      ).rejects.toThrow(EndpointDeprecatedException);

      // Verify the service was never called
      expect(threadsService.advanceThread).not.toHaveBeenCalled();
    });

    it("should include migration guidance in the error response", async () => {
      // Arrange
      const threadId = "test-thread-id";
      const request = { url: `/threads/${threadId}/advance` } as Request;

      // Act & Assert
      const error = await controller
        .advanceThread(threadId, request, {} as any)
        .catch((caughtError) => caughtError);

      expectEndpointDeprecatedProblem(error, {
        requestUrl: request.url,
        migrateToEndpoint: "POST /:id/advancestream",
        detail:
          "The non-streaming /:id/advance endpoint has been deprecated. Please use /:id/advancestream instead.",
      });
    });
  });

  describe("POST /advance (deprecated)", () => {
    it("should return 410 Gone with deprecation error", async () => {
      const request = { url: "/threads/advance" } as Request;

      // Act & Assert - The deprecated endpoint should throw EndpointDeprecatedException
      await expect(controller.createAndAdvanceThread(request)).rejects.toThrow(
        EndpointDeprecatedException,
      );

      // Verify the service was never called
      expect(threadsService.advanceThread).not.toHaveBeenCalled();
    });

    it("should include migration guidance in the error response", async () => {
      const request = { url: "/threads/advance" } as Request;

      // Act & Assert
      const error = await controller
        .createAndAdvanceThread(request)
        .catch((caughtError) => caughtError);

      expectEndpointDeprecatedProblem(error, {
        requestUrl: request.url,
        migrateToEndpoint: "POST /advancestream",
        detail:
          "The non-streaming /advance endpoint has been deprecated. Please use /advancestream instead.",
      });
    });
  });
});
