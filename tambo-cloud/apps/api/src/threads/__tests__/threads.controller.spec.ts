jest.mock("../threads.service", () => ({
  ThreadsService: jest.fn().mockImplementation(() => ({
    advanceThread: jest.fn(),
  })),
}));

jest.mock("../../common/utils/extract-context-info");

import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ContentPartType, MessageRole } from "@tambo-ai-cloud/core";
import { Request, Response } from "express";
import {
  extractContextInfo,
  extractProjectId,
} from "../../common/utils/extract-context-info";
import { ApiKeyGuard } from "../../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../../projects/guards/bearer-token.guard";
import { ProjectAccessOwnGuard } from "../../projects/guards/project-access-own.guard";
import { AdvanceThreadDto } from "../dto/advance-thread.dto";
import { ThreadInProjectGuard } from "../guards/thread-in-project-guard";
import { ThreadsController } from "../threads.controller";
import { ThreadsService } from "../threads.service";

const mockExtractContextInfo = extractContextInfo as jest.MockedFunction<
  typeof extractContextInfo
>;
const mockExtractProjectId = extractProjectId as jest.MockedFunction<
  typeof extractProjectId
>;

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
    mockRequest = {};
    mockResponse = {
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("POST /:id/advancestream", () => {
    it("should propagate errors from extractProjectId to the caller", async () => {
      // Arrange
      const threadId = "test-thread-id";
      const advanceRequestDto = createValidAdvanceRequestDto();
      const testError = new BadRequestException(
        "Any error from extractProjectId",
      );

      mockExtractProjectId.mockImplementation(() => {
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

      // The service should not be called when extractProjectId fails
      expect(threadsService.advanceThread).not.toHaveBeenCalled();
    });

    it("should handle errors from advanceThread and write to stream", async () => {
      // Arrange
      const threadId = "test-thread-id";
      const advanceRequestDto = createValidAdvanceRequestDto();
      const internalError = new Error("Internal service error");

      mockExtractProjectId.mockReturnValue("test-project-id");

      jest
        .spyOn(threadsService, "advanceThread")
        .mockRejectedValue(internalError);

      // Act - The method should handle the error internally
      await expect(async () => {
        await controller.advanceThreadStream(
          threadId,
          mockRequest as Request,
          advanceRequestDto,
          mockResponse as Response,
        );
      }).not.toThrow(); // Should not throw, error should be caught

      // Assert - Error should be written to stream response
      expect(mockResponse.write).toHaveBeenCalledWith(
        `error: ${internalError.message}\n\n`,
      );
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

      jest
        .spyOn(threadsService, "advanceThread")
        .mockRejectedValue(internalError);

      // Act - The method should handle the error internally
      await expect(async () => {
        await controller.createAndAdvanceThreadStream(
          mockRequest as Request,
          advanceRequestDto,
          mockResponse as Response,
        );
      }).not.toThrow(); // Should not throw, error should be caught

      // Assert - Error should be written to stream response
      expect(mockResponse.write).toHaveBeenCalledWith(
        `error: ${internalError.message}\n\n`,
      );
      expect(mockResponse.end).toHaveBeenCalled();
      expect(threadsService.advanceThread).toHaveBeenCalled();
    });
  });
});
