import { NotFoundException } from "@nestjs/common";
import { V1Service } from "../v1.service";
import { ThreadsService } from "../../threads/threads.service";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { operations } from "@tambo-ai-cloud/db";

// Mock the database operations
jest.mock("@tambo-ai-cloud/db", () => ({
  operations: {
    getMessageByIdInThread: jest.fn(),
    getThreadForProjectId: jest.fn(),
    getThreadForRunStart: jest.fn(),
    getMessages: jest.fn(),
    listSuggestionsPaginated: jest.fn(),
    createSuggestions: jest.fn(),
    deleteSuggestionsForMessage: jest.fn(),
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

  const projectId = "prj_test789";
  const userKey = "user_abc123";

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
      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.listSuggestionsPaginated as jest.Mock).mockResolvedValue([]);

      const result = await service.listSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {},
      );

      expect(result).toEqual({
        suggestions: [],
        hasMore: false,
        nextCursor: undefined,
      });
    });

    it("throws NotFoundException when thread does not exist", async () => {
      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.listSuggestions(threadId, messageId, projectId, userKey, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException when message does not exist", async () => {
      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue(null);

      await expect(
        service.listSuggestions(threadId, messageId, projectId, userKey, {}),
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

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.listSuggestionsPaginated as jest.Mock).mockResolvedValue([
        mockSuggestion,
      ]);

      const result = await service.listSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {},
      );

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

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      // Return limit + 1 to indicate hasMore
      (operations.listSuggestionsPaginated as jest.Mock).mockResolvedValue(
        suggestions,
      );

      const result = await service.listSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {
          limit: "1",
        },
      );

      expect(result.suggestions).toHaveLength(1);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });

    it("throws BadRequestException for invalid cursor", async () => {
      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });

      // Invalid base64 cursor should throw
      await expect(
        service.listSuggestions(threadId, messageId, projectId, userKey, {
          cursor: "invalid-cursor-not-base64",
        }),
      ).rejects.toThrow();
    });

    it("returns hasMore=false when results exactly match limit", async () => {
      const suggestion = {
        id: "sug_1",
        messageId,
        title: "Suggestion 1",
        detailedSuggestion: "Description 1",
        createdAt: new Date("2024-01-15T12:00:00Z"),
        updatedAt: new Date("2024-01-15T12:00:00Z"),
      };

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      // Return exactly limit (not limit + 1), so hasMore=false
      (operations.listSuggestionsPaginated as jest.Mock).mockResolvedValue([
        suggestion,
      ]);

      const result = await service.listSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {
          limit: "1",
        },
      );

      expect(result.suggestions).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeUndefined();
    });

    it("passes valid cursor to database operation", async () => {
      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.listSuggestionsPaginated as jest.Mock).mockResolvedValue([]);

      // Create a valid base64 cursor
      const cursorData = {
        createdAt: "2024-01-15T12:00:00.000Z",
        id: "sug_previous",
      };
      const validCursor = Buffer.from(JSON.stringify(cursorData)).toString(
        "base64",
      );

      await service.listSuggestions(threadId, messageId, projectId, userKey, {
        cursor: validCursor,
      });

      expect(operations.listSuggestionsPaginated).toHaveBeenCalledWith(
        expect.anything(),
        messageId,
        {
          cursor: expect.objectContaining({
            id: "sug_previous",
          }),
          limit: 11, // default 10 + 1
        },
      );
    });

    it("throws BadRequestException for empty limit string", async () => {
      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });

      await expect(
        service.listSuggestions(threadId, messageId, projectId, userKey, {
          limit: "",
        }),
      ).rejects.toThrow("Invalid limit");
    });

    it("throws BadRequestException for non-integer limit", async () => {
      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });

      await expect(
        service.listSuggestions(threadId, messageId, projectId, userKey, {
          limit: "abc",
        }),
      ).rejects.toThrow("Invalid limit");
    });

    it("clamps limit to max of 100", async () => {
      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.listSuggestionsPaginated as jest.Mock).mockResolvedValue([]);

      await service.listSuggestions(threadId, messageId, projectId, userKey, {
        limit: "500",
      });

      expect(operations.listSuggestionsPaginated).toHaveBeenCalledWith(
        expect.anything(),
        messageId,
        {
          cursor: undefined,
          limit: 101, // clamped to 100 + 1
        },
      );
    });

    it("throws BadRequestException when cursor messageId does not match", async () => {
      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });

      // Create a cursor with a different messageId
      const cursorData = {
        createdAt: "2024-01-15T12:00:00.000Z",
        id: "sug_previous",
        messageId: "different_message_id",
      };
      const cursorWithWrongMessage = Buffer.from(
        JSON.stringify(cursorData),
      ).toString("base64url");

      try {
        await service.listSuggestions(threadId, messageId, projectId, userKey, {
          cursor: cursorWithWrongMessage,
        });
        fail("Expected BadRequestException to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const response = (
          error as { getResponse?: () => unknown }
        ).getResponse?.();
        expect(response).toMatchObject({
          type: "urn:tambo:error:invalid_cursor",
          detail: "Cursor does not belong to this message",
        });
      }
    });

    it("includes messageId in nextCursor for pagination", async () => {
      const suggestion = {
        id: "sug_1",
        messageId,
        title: "Suggestion 1",
        detailedSuggestion: "Description 1",
        createdAt: new Date("2024-01-15T12:00:00Z"),
        updatedAt: new Date("2024-01-15T12:00:00Z"),
      };

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      // Return limit + 1 to indicate hasMore
      (operations.listSuggestionsPaginated as jest.Mock).mockResolvedValue([
        suggestion,
        { ...suggestion, id: "sug_2" },
      ]);

      const result = await service.listSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {
          limit: "1",
        },
      );

      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();

      // Decode the cursor and verify it contains messageId
      const decoded = JSON.parse(
        Buffer.from(result.nextCursor!, "base64url").toString("utf8"),
      );
      expect(decoded.messageId).toBe(messageId);
    });
  });

  describe("generateSuggestions", () => {
    const threadId = "thr_test123";
    const messageId = "msg_test456";

    it("throws NotFoundException when thread does not exist", async () => {
      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.generateSuggestions(
          threadId,
          messageId,
          projectId,
          userKey,
          {},
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException when message does not exist", async () => {
      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
        contextKey: userKey,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue(null);

      await expect(
        service.generateSuggestions(
          threadId,
          messageId,
          projectId,
          userKey,
          {},
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("returns empty list when no suggestions are generated", async () => {
      const mockTamboBackend = {
        generateSuggestions: jest.fn().mockResolvedValue({
          suggestions: [],
        }),
      };

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
        contextKey: userKey,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      (operations.deleteSuggestionsForMessage as jest.Mock).mockResolvedValue(
        0,
      );
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );

      const result = await service.generateSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {},
      );

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

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
        contextKey: userKey,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      (operations.deleteSuggestionsForMessage as jest.Mock).mockResolvedValue(
        0,
      );
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );

      const result = await service.generateSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {},
      );

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

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
        contextKey: userKey,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      (operations.deleteSuggestionsForMessage as jest.Mock).mockResolvedValue(
        0,
      );
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );
      (operations.createSuggestions as jest.Mock).mockResolvedValue([
        mockSavedSuggestion,
      ]);

      const result = await service.generateSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {
          maxSuggestions: 5,
        },
      );

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

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
        contextKey: null, // contextKey null -> defaults to "anonymous"
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      (operations.deleteSuggestionsForMessage as jest.Mock).mockResolvedValue(
        0,
      );
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );

      await service.generateSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {},
      );

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

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
        contextKey: userKey,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      (operations.deleteSuggestionsForMessage as jest.Mock).mockResolvedValue(
        0,
      );
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );

      await service.generateSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {
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
        },
      );

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

    it("fetches and passes thread messages to suggestion generator", async () => {
      const mockMessages = [
        {
          id: "msg_1",
          role: "user",
          content: [{ type: "text", text: "Hello" }],
        },
        {
          id: "msg_2",
          role: "assistant",
          content: [{ type: "text", text: "Hi there" }],
        },
      ];

      const mockTamboBackend = {
        generateSuggestions: jest.fn().mockResolvedValue({
          suggestions: [],
        }),
      };

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
        contextKey: userKey,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue(mockMessages);
      (operations.deleteSuggestionsForMessage as jest.Mock).mockResolvedValue(
        0,
      );
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );

      await service.generateSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {},
      );

      // Verify messages are fetched for the correct thread
      expect(operations.getMessages).toHaveBeenCalledWith(
        expect.anything(),
        threadId,
      );
      // Verify generateSuggestions is called with an array (messages are converted via dbMessageToThreadMessage)
      expect(mockTamboBackend.generateSuggestions).toHaveBeenCalledWith(
        expect.any(Array),
        3,
        [],
        threadId,
        false,
      );
    });

    it("generates and persists multiple suggestions", async () => {
      const mockGeneratedSuggestions = [
        { title: "Suggestion 1", detailedSuggestion: "Description 1" },
        { title: "Suggestion 2", detailedSuggestion: "Description 2" },
        { title: "Suggestion 3", detailedSuggestion: "Description 3" },
      ];
      const mockSavedSuggestions = mockGeneratedSuggestions.map((s, i) => ({
        id: `sug_${i + 1}`,
        messageId,
        title: s.title,
        detailedSuggestion: s.detailedSuggestion,
        createdAt: new Date("2024-01-15T12:00:00Z"),
        updatedAt: new Date("2024-01-15T12:00:00Z"),
      }));

      const mockTamboBackend = {
        generateSuggestions: jest.fn().mockResolvedValue({
          suggestions: mockGeneratedSuggestions,
        }),
      };

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
        contextKey: userKey,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      (operations.deleteSuggestionsForMessage as jest.Mock).mockResolvedValue(
        0,
      );
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );
      (operations.createSuggestions as jest.Mock).mockResolvedValue(
        mockSavedSuggestions,
      );

      const result = await service.generateSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {},
      );

      expect(operations.createSuggestions).toHaveBeenCalledWith(
        expect.anything(),
        mockGeneratedSuggestions.map((s) => ({
          messageId,
          title: s.title,
          detailedSuggestion: s.detailedSuggestion,
        })),
      );
      expect(result.suggestions).toHaveLength(3);
      expect(result.suggestions.map((s) => s.title)).toEqual([
        "Suggestion 1",
        "Suggestion 2",
        "Suggestion 3",
      ]);
    });

    it("passes userKey to createTamboBackendForThread", async () => {
      const mockTamboBackend = {
        generateSuggestions: jest.fn().mockResolvedValue({
          suggestions: [],
        }),
      };

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
        contextKey: userKey,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      (operations.deleteSuggestionsForMessage as jest.Mock).mockResolvedValue(
        0,
      );
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );

      await service.generateSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {},
      );

      expect(
        mockThreadsService.createTamboBackendForThread,
      ).toHaveBeenCalledWith(threadId, userKey);
    });

    it("deletes existing suggestions before creating new ones (replace semantics)", async () => {
      const mockGeneratedSuggestion = {
        title: "New suggestion",
        detailedSuggestion: "New description",
      };
      const mockSavedSuggestion = {
        id: "sug_new",
        messageId,
        title: "New suggestion",
        detailedSuggestion: "New description",
        createdAt: new Date("2024-01-15T12:00:00Z"),
        updatedAt: new Date("2024-01-15T12:00:00Z"),
      };

      const mockTamboBackend = {
        generateSuggestions: jest.fn().mockResolvedValue({
          suggestions: [mockGeneratedSuggestion],
        }),
      };

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
        contextKey: userKey,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue([]);
      (operations.deleteSuggestionsForMessage as jest.Mock).mockResolvedValue(
        2,
      ); // 2 existing suggestions deleted
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );
      (operations.createSuggestions as jest.Mock).mockResolvedValue([
        mockSavedSuggestion,
      ]);

      await service.generateSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {},
      );

      // Verify delete was called before create
      expect(operations.deleteSuggestionsForMessage).toHaveBeenCalledWith(
        expect.anything(),
        messageId,
      );
      expect(operations.createSuggestions).toHaveBeenCalled();

      // Verify order: delete happens before create
      const deleteCallOrder = (
        operations.deleteSuggestionsForMessage as jest.Mock
      ).mock.invocationCallOrder[0];
      const createCallOrder = (operations.createSuggestions as jest.Mock).mock
        .invocationCallOrder[0];
      expect(deleteCallOrder).toBeLessThan(createCallOrder);
    });

    it("limits messages to most recent 5 for context", async () => {
      // Create 10 messages
      const mockMessages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg_${i + 1}`,
        role: i % 2 === 0 ? "user" : "assistant",
        content: [{ type: "text", text: `Message ${i + 1}` }],
      }));

      const mockTamboBackend = {
        generateSuggestions: jest.fn().mockResolvedValue({
          suggestions: [],
        }),
      };

      (operations.getThreadForProjectId as jest.Mock).mockResolvedValue({
        id: threadId,
        contextKey: userKey,
      });
      (operations.getMessageByIdInThread as jest.Mock).mockResolvedValue({
        id: messageId,
        threadId,
      });
      (operations.getMessages as jest.Mock).mockResolvedValue(mockMessages);
      (operations.deleteSuggestionsForMessage as jest.Mock).mockResolvedValue(
        0,
      );
      mockThreadsService.createTamboBackendForThread.mockResolvedValue(
        mockTamboBackend as unknown as ReturnType<
          ThreadsService["createTamboBackendForThread"]
        >,
      );

      await service.generateSuggestions(
        threadId,
        messageId,
        projectId,
        userKey,
        {},
      );

      // Verify generateSuggestions was called
      expect(mockTamboBackend.generateSuggestions).toHaveBeenCalled();

      // The first argument should be an array of messages
      const passedMessages =
        mockTamboBackend.generateSuggestions.mock.calls[0][0];

      // Verify the array has exactly 5 elements (limited from 10)
      // Note: dbMessageToThreadMessage is mocked to return the message as-is
      expect(Array.isArray(passedMessages)).toBe(true);
      expect(passedMessages).toHaveLength(5);
    });
  });
});
