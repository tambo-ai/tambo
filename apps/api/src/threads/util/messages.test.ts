import {
  ActionType,
  ChatCompletionContentPart,
  ContentPartType,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import {
  HydraDatabase,
  HydraTransaction,
  operations,
  schema,
} from "@tambo-ai-cloud/db";
import { ThreadMessageDto } from "../dto/message.dto";
import {
  addAssistantMessageToThread,
  addMessage,
  updateMessage,
  verifyLatestMessageConsistency,
} from "./messages";

jest.mock("@tambo-ai-cloud/db", () => {
  const actual = jest.requireActual("@tambo-ai-cloud/db");
  return {
    ...actual,
    operations: {
      addMessage: jest.fn(),
      updateMessage: jest.fn(),
    },
    schema: {
      messages: {
        threadId: { name: "threadId" },
      },
    },
  };
});

describe("messages utilities", () => {
  const mockDb = {
    query: {
      messages: {
        findMany: jest.fn().mockImplementation(async () => []),
      },
    },
    transaction: jest.fn(),
  } as unknown as HydraDatabase;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addMessage", () => {
    it("should add a message to the thread", async () => {
      const message: ThreadMessageDto = {
        id: "message-id",
        threadId: "thread-id",
        role: MessageRole.User,
        content: [{ type: "text" as ContentPartType.Text, text: "Hello" }],
        createdAt: new Date(),
        componentState: {},
      };

      const mockResponse: typeof schema.messages.$inferSelect = {
        id: "msg1",
        threadId: "thread1",
        parentMessageId: null,
        role: MessageRole.User,
        content: [{ type: "text" as ContentPartType.Text, text: "Hello" }],
        additionalContext: { extra: "context" },
        createdAt: new Date(),
        componentState: {},
        metadata: null,
        toolCallId: null,
        toolCallRequest: null,
        componentDecision: null,
        actionType: null,
        error: null,
        isCancelled: false,
        reasoning: null,
        reasoningDurationMS: null,
      };

      jest.mocked(operations.addMessage).mockResolvedValue(mockResponse);

      const result = await addMessage(mockDb, "thread1", message);

      expect(operations.addMessage).toHaveBeenCalledWith(mockDb, "thread1", {
        role: MessageRole.User,
        content: [{ type: "text" as ContentPartType.Text, text: "Hello" }],
        component: undefined,
        metadata: undefined,
        actionType: undefined,
        toolCallRequest: undefined,
        tool_call_id: undefined,
        componentState: {},
        additionalContext: {},
        error: undefined,
        isCancelled: false,
        reasoning: undefined,
        reasoningDurationMS: undefined,
      });

      expect(result).toEqual({
        id: "msg1",
        threadId: "thread1",
        role: MessageRole.User,
        content: [{ type: "text" as ContentPartType.Text, text: "Hello" }],
        additionalContext: { extra: "context" },
        createdAt: mockResponse.createdAt,
        componentState: {},
        isCancelled: false,
      });
    });
  });

  describe("updateMessage", () => {
    it("should update a message in the thread", async () => {
      const message: ThreadMessageDto = {
        id: "message-id",
        threadId: "thread-id",
        role: MessageRole.User,
        content: [
          { type: "text" as ContentPartType.Text, text: "Updated message" },
        ],
        createdAt: new Date(),
        componentState: {},
      };

      const mockResponse: typeof schema.messages.$inferSelect = {
        id: "msg1",
        threadId: "thread1",
        parentMessageId: null,
        role: MessageRole.User,
        content: [
          { type: "text" as ContentPartType.Text, text: "Updated message" },
        ],
        additionalContext: { extra: "context" },
        createdAt: new Date(),
        componentState: {},
        actionType: null,
        metadata: null,
        toolCallId: null,
        toolCallRequest: null,
        componentDecision: null,
        error: null,
        isCancelled: false,
        reasoning: null,
        reasoningDurationMS: null,
      };

      jest.mocked(operations.updateMessage).mockResolvedValue(mockResponse);

      const result = await updateMessage(mockDb, "msg1", message);

      expect(operations.updateMessage).toHaveBeenCalledWith(mockDb, "msg1", {
        content: [
          { type: "text" as ContentPartType.Text, text: "Updated message" },
        ],
        componentDecision: undefined,
        metadata: undefined,
        actionType: undefined,
        toolCallRequest: undefined,
        toolCallId: undefined,
        additionalContext: {},
        error: undefined,
      });

      expect(result).toEqual({
        id: "msg1",
        threadId: "thread1",
        role: MessageRole.User,
        content: [
          { type: "text" as ContentPartType.Text, text: "Updated message" },
        ],
        additionalContext: { extra: "context" },
        createdAt: mockResponse.createdAt,
        componentState: {},
        parentMessageId: undefined,
        toolCallRequest: undefined,
        tool_call_id: undefined,
        metadata: undefined,
        actionType: undefined,
        reasoning: undefined,
        error: undefined,
        isCancelled: false,
      });
    });
  });

  describe("addAssistantMessageToThread", () => {
    it.failing("should add an assistant message to the thread", async () => {
      const componentDecision: LegacyComponentDecision = {
        message: "Assistant response",
        componentName: "TestComponent",
        props: { prop1: "value1" },
        componentState: { state1: "value1" },
        reasoning: ["test reasoning"],
      };

      const mockResponse: ThreadMessage = {
        id: "msg1",
        threadId: "thread1",
        role: MessageRole.Assistant,
        content: [
          { type: "text" as ContentPartType.Text, text: "Assistant response" },
        ],
        createdAt: new Date(),
        componentState: { state1: "value1" },
      };

      jest.mocked(addMessage).mockResolvedValue(mockResponse);

      const result = await addAssistantMessageToThread(
        mockDb,
        componentDecision,
        "thread1",
      );
      console.log(result);

      expect(addMessage).toHaveBeenCalledWith(
        mockDb,
        "thread1",
        expect.objectContaining({
          role: MessageRole.Assistant,
          content: [
            {
              type: "text" as ContentPartType.Text,
              text: "Assistant response",
            },
          ],
          component: {
            message: "Assistant response",
            componentName: "TestComponent",
            props: { prop1: "value1" },
            componentState: { state1: "value1" },
            reasoning: "test reasoning",
          },
        }),
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("verifyLatestMessageConsistency", () => {
    it("should verify the latest message consistency", async () => {
      const mockDb = {
        query: {
          messages: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        },
      } as unknown as HydraTransaction;

      const mockMessage: typeof schema.messages.$inferSelect = {
        id: "msg1",
        threadId: "thread1",
        parentMessageId: null,
        role: MessageRole.User,
        content: [
          {
            type: "text" as ContentPartType.Text,
            text: "Latest message",
          },
        ] as ChatCompletionContentPart[],
        additionalContext: { extra: "context" },
        createdAt: new Date(),
        componentState: {},
        metadata: null,
        toolCallId: null,
        toolCallRequest: null,
        componentDecision: null,
        actionType: ActionType.ToolCall,
        error: null,
        isCancelled: false,
        reasoning: null,
        reasoningDurationMS: null,
      };

      const newMessage: ThreadMessage = {
        id: mockMessage.id,
        threadId: mockMessage.threadId,
        role: MessageRole.User,
        content: mockMessage.content,
        createdAt: mockMessage.createdAt,
        parentMessageId: undefined,
        componentState: {},
        actionType: ActionType.ToolCall,
        metadata: {},
        additionalContext: { extra: "context" },
        error: undefined,
        isCancelled: mockMessage.isCancelled,
      };

      jest
        .mocked(mockDb.query.messages.findMany)
        .mockResolvedValue([mockMessage]);
      jest.mocked(operations.updateMessage).mockResolvedValue(mockMessage);

      await verifyLatestMessageConsistency(
        mockDb,
        "thread1",
        newMessage.id,
        false,
      );

      expect(mockDb.query.messages.findMany).toHaveBeenCalled();
    });

    it("should throw error if latest message is inconsistent", async () => {
      const addedUserMessage: ThreadMessage = {
        id: "msg1",
        threadId: "thread1",
        role: MessageRole.User,
        content: [
          { type: "text" as ContentPartType.Text, text: "test message" },
        ],
        createdAt: new Date(),
        componentState: {},
      };

      const mockMessages = [
        {
          id: "msg2",
          threadId: "thread1",
          role: MessageRole.User,
          content: [
            { type: "text" as ContentPartType.Text, text: "different message" },
          ],
          createdAt: new Date(),
          componentState: {},
        },
      ];

      const mockTransaction = {
        query: {
          messages: {
            findMany: jest.fn().mockResolvedValue(mockMessages),
          },
        },
      } as unknown as HydraTransaction;

      await expect(
        verifyLatestMessageConsistency(
          mockTransaction,
          "thread1",
          addedUserMessage.id,
          false,
        ),
      ).rejects.toThrow(
        "Latest message before write is not the same as the added user message",
      );
    });
  });
});
