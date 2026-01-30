import { NotFoundException } from "@nestjs/common";
import { V1Service } from "../v1.service";
import { ThreadsService } from "../../threads/threads.service";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { operations } from "@tambo-ai-cloud/db";

// Mock the database operations
jest.mock("@tambo-ai-cloud/db", () => ({
  operations: {
    getMessageByIdInThread: jest.fn(),
    getThreadForRunStart: jest.fn(),
    getMessages: jest.fn(),
    listSuggestionsPaginated: jest.fn(),
    createSuggestions: jest.fn(),
  },
  dbMessageToThreadMessage: jest.fn((m) => m),
  schema: {
    threads: { id: "id" },
    messages: {
      id: "id",
      threadId: "threadId",
      componentState: "componentState",
    },
  },
}));

describe("V1Service - Suggestions", () => {
  let service: V1Service;
  let mockDb: jest.Mocked<HydraDatabase>;
  let mockThreadsService: jest.Mocked<ThreadsService>;

  beforeEach(() => {
    mockDb = {} as jest.Mocked<HydraDatabase>;
    mockThreadsService = {
      createTamboBackendForThread: jest.fn(),
    } as unknown as jest.Mocked<ThreadsService>;

    service = new V1Service(mockDb, mockThreadsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listSuggestions", () => {
    const threadId = "thr_test123";
    const messageId = "msg_test456";

    it("returns empty list when no suggestions exist", async () => {
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.listSuggestionsPaginated as jest.Mock).mockResolvedValue([]);

      const result = await service.listSuggestions(threadId, messageId, {});

      expect(result).toEqual({
        suggestions: [],
        hasMore: false,
        nextCursor: undefined,
      });
    });

    it("throws NotFoundException when message does not exist", async () => {
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue(null);

      await expect(
        service.listSuggestions(threadId, messageId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it("returns suggestions with correct DTO mapping", async () => {
      const mockSuggestion = {
        id: "sug_abc123",
        messageId,
        title: "Test suggestion",
        detailedSuggestion: "This is a test suggestion description",
        createdAt: new Date("2024-01-15T12:00:00Z"),
        updatedAt: new Date("2024-01-15T12:00:00Z"),
      };

      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.listSuggestionsPaginated as jest.Mock).mockResolvedValue([
        mockSuggestion,
      ]);

      const result = await service.listSuggestions(threadId, messageId, {});

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]).toEqual({
        id: "sug_abc123",
        messageId,
        title: "Test suggestion",
        description: "This is a test suggestion description", // Note: renamed from detailedSuggestion
        createdAt: "2024-01-15T12:00:00.000Z",
      });
    });

    it("handles pagination correctly", async () => {
      const suggestions = [
        {
          id: "sug_1",
          messageId,
          title: "Suggestion 1",
          detailedSuggestion: "Description 1",
          createdAt: new Date("2024-01-15T12:00:00Z"),
          updatedAt: new Date("2024-01-15T12:00:00Z"),
        },
        {
          id: "sug_2",
          messageId,
          title: "Suggestion 2",
          detailedSuggestion: "Description 2",
          createdAt: new Date("2024-01-15T12:01:00Z"),
          updatedAt: new Date("2024-01-15T12:01:00Z"),
        },
      ];

      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      // Return limit + 1 to indicate hasMore
      (operations.listSuggestionsPaginated as jest.Mock).mockResolvedValue(
        suggestions,
      );

      const result = await service.listSuggestions(threadId, messageId, {
        limit: "1",
      });

      expect(result.suggestions).toHaveLength(1);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });

    it("throws BadRequestException for invalid cursor", async () => {
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });

      // Invalid base64 cursor should throw
      await expect(
        service.listSuggestions(threadId, messageId, {
          cursor: "invalid-cursor-not-base64",
        }),
      ).rejects.toThrow();
    });
  });

  describe("generateSuggestions", () => {
    const threadId = "thr_test123";
    const messageId = "msg_test456";

    it("throws NotFoundException when message does not exist", async () => {
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue(null);

      await expect(
        service.generateSuggestions(threadId, messageId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException when thread does not exist", async () => {
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getThreadForRunStart as jest.Mock).mockResolvedValue({
        thread: null,
        hasMessages: false,
      });

      await expect(
        service.generateSuggestions(threadId, messageId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it("returns empty list when no suggestions are generated", async () => {
      const mockTamboBackend = {
        generateSuggestions: jest.fn().mockResolvedValue({
          suggestions: [],
        }),
      };

      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getThreadForRunStart as jest.Mock).mockResolvedValue({
        thread: { id: threadId, contextKey: "test-context" },
        hasMessages: true,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );

      const result = await service.generateSuggestions(threadId, messageId, {});

      expect(result).toEqual({
        suggestions: [],
        hasMore: false,
      });
    });

    it("handles undefined suggestions in response gracefully", async () => {
      const mockTamboBackend = {
        generateSuggestions: jest.fn().mockResolvedValue({
          // suggestions field is undefined
        }),
      };

      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getThreadForRunStart as jest.Mock).mockResolvedValue({
        thread: { id: threadId, contextKey: "test-context" },
        hasMessages: true,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );

      const result = await service.generateSuggestions(threadId, messageId, {});

      expect(result).toEqual({
        suggestions: [],
        hasMore: false,
      });
    });

    it("generates and persists suggestions", async () => {
      const mockGeneratedSuggestion = {
        title: "Generated suggestion",
        detailedSuggestion: "Generated description",
      };
      const mockSavedSuggestion = {
        id: "sug_generated",
        messageId,
        title: "Generated suggestion",
        detailedSuggestion: "Generated description",
        createdAt: new Date("2024-01-15T12:00:00Z"),
        updatedAt: new Date("2024-01-15T12:00:00Z"),
      };

      const mockTamboBackend = {
        generateSuggestions: jest.fn().mockResolvedValue({
          suggestions: [mockGeneratedSuggestion],
        }),
      };

      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getThreadForRunStart as jest.Mock).mockResolvedValue({
        thread: { id: threadId, contextKey: "test-context" },
        hasMessages: true,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );
      (operations.createSuggestions as jest.Mock).mockResolvedValue([
        mockSavedSuggestion,
      ]);

      const result = await service.generateSuggestions(threadId, messageId, {
        maxSuggestions: 5,
      });

      expect(mockTamboBackend.generateSuggestions).toHaveBeenCalledWith(
        expect.any(Array),
        5,
        expect.any(Array),
        threadId,
        false,
      );
      expect(operations.createSuggestions).toHaveBeenCalledWith(
        expect.anything(),
        [
          {
            messageId,
            title: "Generated suggestion",
            detailedSuggestion: "Generated description",
          },
        ],
      );
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].title).toBe("Generated suggestion");
    });

    it("uses default maxSuggestions when not provided", async () => {
      const mockTamboBackend = {
        generateSuggestions: jest.fn().mockResolvedValue({
          suggestions: [],
        }),
      };

      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getThreadForRunStart as jest.Mock).mockResolvedValue({
        thread: { id: threadId, contextKey: null }, // contextKey null -> defaults to "anonymous"
        hasMessages: true,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );

      await service.generateSuggestions(threadId, messageId, {});

      // Default maxSuggestions is 3
      expect(mockTamboBackend.generateSuggestions).toHaveBeenCalledWith(
        expect.any(Array),
        3,
        expect.any(Array),
        threadId,
        false,
      );
    });

    it("converts V1 available components to internal format", async () => {
      const mockTamboBackend = {
        generateSuggestions: jest.fn().mockResolvedValue({
          suggestions: [],
        }),
      };

      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getThreadForRunStart as jest.Mock).mockResolvedValue({
        thread: { id: threadId, contextKey: "test" },
        hasMessages: true,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );

      await service.generateSuggestions(threadId, messageId, {
        availableComponents: [
          {
            name: "WeatherCard",
            description: "Shows weather info",
            propsSchema: {
              type: "object",
              properties: { temp: { type: "number" } },
            },
          },
        ],
      });

      expect(mockTamboBackend.generateSuggestions).toHaveBeenCalledWith(
        expect.any(Array),
        3,
        [
          {
            name: "WeatherCard",
            description: "Shows weather info",
            props: { type: "object", properties: { temp: { type: "number" } } },
            contextTools: [],
          },
        ],
        threadId,
        false,
      );
    });
  });
});
