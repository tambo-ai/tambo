import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Request } from "express";
import { V1Controller } from "../v1.controller";
import { V1Service } from "../v1.service";
import { extractContextInfo } from "../../common/utils/extract-context-info";

jest.mock("../../common/utils/extract-context-info");
const mockExtractContextInfo = extractContextInfo as jest.MockedFunction<
  typeof extractContextInfo
>;

describe("V1Controller", () => {
  let controller: V1Controller;
  let mockV1Service: jest.Mocked<V1Service>;

  beforeEach(() => {
    mockV1Service = {
      listThreads: jest.fn(),
      getThread: jest.fn(),
      createThread: jest.fn(),
      deleteThread: jest.fn(),
      listMessages: jest.fn(),
      getMessage: jest.fn(),
      updateComponentState: jest.fn(),
    } as unknown as jest.Mocked<V1Service>;

    // Create controller directly with mocked service
    controller = new V1Controller(mockV1Service);
    mockExtractContextInfo.mockClear();
  });

  describe("Thread endpoints", () => {
    describe("listThreads", () => {
      it("should list threads for a project", async () => {
        const mockRequest = {} as Request;
        mockExtractContextInfo.mockReturnValue({
          projectId: "prj_123",
          contextKey: undefined,
        });
        const mockResponse = {
          threads: [{ id: "thr_1", projectId: "prj_123" }],
          hasMore: false,
        };
        mockV1Service.listThreads.mockResolvedValue(mockResponse as any);

        const result = await controller.listThreads(mockRequest, {});

        expect(mockV1Service.listThreads).toHaveBeenCalledWith(
          "prj_123",
          undefined,
          {},
        );
        expect(result).toEqual(mockResponse);
      });

      it("should filter by context key from query", async () => {
        const mockRequest = {} as Request;
        mockExtractContextInfo.mockReturnValue({
          projectId: "prj_123",
          contextKey: undefined,
        });
        mockV1Service.listThreads.mockResolvedValue({
          threads: [],
          hasMore: false,
        } as any);

        await controller.listThreads(mockRequest, { contextKey: "user_456" });

        expect(mockV1Service.listThreads).toHaveBeenCalledWith(
          "prj_123",
          "user_456",
          { contextKey: "user_456" },
        );
      });

      it("should use bearer token context key when query contextKey is not provided", async () => {
        const mockRequest = {} as Request;
        mockExtractContextInfo.mockReturnValue({
          projectId: "prj_123",
          contextKey: "bearer_context",
        });
        mockV1Service.listThreads.mockResolvedValue({
          threads: [],
          hasMore: false,
        } as any);

        await controller.listThreads(mockRequest, {});

        expect(mockV1Service.listThreads).toHaveBeenCalledWith(
          "prj_123",
          "bearer_context",
          {},
        );
      });

      it("should prefer query contextKey over bearer token context key", async () => {
        const mockRequest = {} as Request;
        mockExtractContextInfo.mockReturnValue({
          projectId: "prj_123",
          contextKey: "bearer_context",
        });
        mockV1Service.listThreads.mockResolvedValue({
          threads: [],
          hasMore: false,
        } as any);

        await controller.listThreads(mockRequest, {
          contextKey: "query_context",
        });

        expect(mockV1Service.listThreads).toHaveBeenCalledWith(
          "prj_123",
          "query_context",
          { contextKey: "query_context" },
        );
      });
    });

    describe("getThread", () => {
      it("should return thread with messages", async () => {
        const mockThread = {
          id: "thr_123",
          projectId: "prj_123",
          runStatus: "idle",
          messages: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };
        mockV1Service.getThread.mockResolvedValue(mockThread as any);

        const result = await controller.getThread("thr_123");

        expect(mockV1Service.getThread).toHaveBeenCalledWith("thr_123");
        expect(result).toEqual(mockThread);
      });

      it("should throw NotFoundException for non-existent thread", async () => {
        mockV1Service.getThread.mockRejectedValue(
          new NotFoundException("Thread thr_nonexistent not found"),
        );

        await expect(controller.getThread("thr_nonexistent")).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe("createThread", () => {
      it("should create a new thread", async () => {
        const mockRequest = {} as Request;
        mockExtractContextInfo.mockReturnValue({
          projectId: "prj_123",
          contextKey: undefined,
        });
        const mockThread = {
          id: "thr_new",
          projectId: "prj_123",
          runStatus: "idle",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };
        mockV1Service.createThread.mockResolvedValue(mockThread as any);

        const result = await controller.createThread(mockRequest, {});

        expect(mockV1Service.createThread).toHaveBeenCalledWith(
          "prj_123",
          undefined,
          {},
        );
        expect(result).toEqual(mockThread);
      });

      it("should create thread with context key from body", async () => {
        const mockRequest = {} as Request;
        mockExtractContextInfo.mockReturnValue({
          projectId: "prj_123",
          contextKey: undefined,
        });
        mockV1Service.createThread.mockResolvedValue({} as any);

        await controller.createThread(mockRequest, { contextKey: "user_456" });

        expect(mockV1Service.createThread).toHaveBeenCalledWith(
          "prj_123",
          "user_456",
          { contextKey: "user_456" },
        );
      });

      it("should create thread with metadata", async () => {
        const mockRequest = {} as Request;
        mockExtractContextInfo.mockReturnValue({
          projectId: "prj_123",
          contextKey: undefined,
        });
        mockV1Service.createThread.mockResolvedValue({} as any);

        const dto = { metadata: { customField: "value" } };
        await controller.createThread(mockRequest, dto);

        expect(mockV1Service.createThread).toHaveBeenCalledWith(
          "prj_123",
          undefined,
          dto,
        );
      });

      it("should use bearer token context key when body contextKey is not provided", async () => {
        const mockRequest = {} as Request;
        mockExtractContextInfo.mockReturnValue({
          projectId: "prj_123",
          contextKey: "bearer_context",
        });
        mockV1Service.createThread.mockResolvedValue({} as any);

        await controller.createThread(mockRequest, {});

        expect(mockV1Service.createThread).toHaveBeenCalledWith(
          "prj_123",
          "bearer_context",
          {},
        );
      });

      it("should prefer body contextKey over bearer token context key", async () => {
        const mockRequest = {} as Request;
        mockExtractContextInfo.mockReturnValue({
          projectId: "prj_123",
          contextKey: "bearer_context",
        });
        mockV1Service.createThread.mockResolvedValue({} as any);

        await controller.createThread(mockRequest, {
          contextKey: "body_context",
        });

        expect(mockV1Service.createThread).toHaveBeenCalledWith(
          "prj_123",
          "body_context",
          { contextKey: "body_context" },
        );
      });
    });

    describe("deleteThread", () => {
      it("should delete a thread", async () => {
        mockV1Service.deleteThread.mockResolvedValue();

        await controller.deleteThread("thr_123");

        expect(mockV1Service.deleteThread).toHaveBeenCalledWith("thr_123");
      });

      it("should throw NotFoundException for non-existent thread", async () => {
        mockV1Service.deleteThread.mockRejectedValue(
          new NotFoundException("Thread thr_nonexistent not found"),
        );

        await expect(
          controller.deleteThread("thr_nonexistent"),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe("Message endpoints", () => {
    describe("listMessages", () => {
      it("should list messages in a thread", async () => {
        const mockResponse = {
          messages: [
            {
              id: "msg_1",
              role: "user",
              content: [{ type: "text", text: "Hello" }],
            },
          ],
          hasMore: false,
        };
        mockV1Service.listMessages.mockResolvedValue(mockResponse as any);

        const result = await controller.listMessages("thr_123", {});

        expect(mockV1Service.listMessages).toHaveBeenCalledWith("thr_123", {});
        expect(result).toEqual(mockResponse);
      });

      it("should support pagination query params", async () => {
        mockV1Service.listMessages.mockResolvedValue({
          messages: [],
          hasMore: true,
          nextCursor: "2024-01-01T00:00:00Z",
        } as any);

        await controller.listMessages("thr_123", {
          limit: "10",
          cursor: "2024-01-01T00:00:00Z",
          order: "desc",
        });

        expect(mockV1Service.listMessages).toHaveBeenCalledWith("thr_123", {
          limit: "10",
          cursor: "2024-01-01T00:00:00Z",
          order: "desc",
        });
      });
    });

    describe("getMessage", () => {
      it("should return a single message", async () => {
        const mockMessage = {
          id: "msg_123",
          role: "assistant",
          content: [{ type: "text", text: "Hi there!" }],
          createdAt: "2024-01-01T00:00:00Z",
        };
        mockV1Service.getMessage.mockResolvedValue(mockMessage as any);

        const result = await controller.getMessage("thr_123", "msg_123");

        expect(mockV1Service.getMessage).toHaveBeenCalledWith(
          "thr_123",
          "msg_123",
        );
        expect(result).toEqual(mockMessage);
      });

      it("should throw NotFoundException for non-existent message", async () => {
        mockV1Service.getMessage.mockRejectedValue(
          new NotFoundException(
            "Message msg_nonexistent not found in thread thr_123",
          ),
        );

        await expect(
          controller.getMessage("thr_123", "msg_nonexistent"),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe("Component State endpoints", () => {
    describe("updateComponentState", () => {
      it("should update component state with full replacement", async () => {
        const mockResponse = {
          state: { loading: false, data: [1, 2, 3] },
        };
        mockV1Service.updateComponentState.mockResolvedValue(mockResponse);

        const result = await controller.updateComponentState(
          "thr_123",
          "comp_456",
          { state: { loading: false, data: [1, 2, 3] } },
        );

        expect(mockV1Service.updateComponentState).toHaveBeenCalledWith(
          "thr_123",
          "comp_456",
          { state: { loading: false, data: [1, 2, 3] } },
        );
        expect(result).toEqual(mockResponse);
      });

      it("should update component state with JSON Patch", async () => {
        const mockResponse = {
          state: { loading: false, data: [1, 2, 3, 4] },
        };
        mockV1Service.updateComponentState.mockResolvedValue(mockResponse);

        const patch = [
          { op: "replace" as const, path: "/loading", value: false },
          { op: "add" as const, path: "/data/-", value: 4 },
        ];

        const result = await controller.updateComponentState(
          "thr_123",
          "comp_456",
          { patch },
        );

        expect(mockV1Service.updateComponentState).toHaveBeenCalledWith(
          "thr_123",
          "comp_456",
          { patch },
        );
        expect(result).toEqual(mockResponse);
      });

      it("should throw ConflictException when thread has active run", async () => {
        mockV1Service.updateComponentState.mockRejectedValue(
          new ConflictException("Cannot update state while run is active"),
        );

        await expect(
          controller.updateComponentState("thr_123", "comp_456", {
            state: { loading: false },
          }),
        ).rejects.toThrow(ConflictException);
      });

      it("should throw NotFoundException for non-existent component", async () => {
        mockV1Service.updateComponentState.mockRejectedValue(
          new NotFoundException(
            "Component comp_nonexistent not found in thread thr_123",
          ),
        );

        await expect(
          controller.updateComponentState("thr_123", "comp_nonexistent", {
            state: { loading: false },
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it("should throw BadRequestException for invalid JSON Patch", async () => {
        mockV1Service.updateComponentState.mockRejectedValue(
          new BadRequestException("Invalid JSON Patch"),
        );

        await expect(
          controller.updateComponentState("thr_123", "comp_456", {
            patch: [{ op: "move", path: "/foo" }],
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it("should throw BadRequestException when neither state nor patch provided", async () => {
        mockV1Service.updateComponentState.mockRejectedValue(
          new BadRequestException("Either state or patch must be provided"),
        );

        await expect(
          controller.updateComponentState("thr_123", "comp_456", {}),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });
});
