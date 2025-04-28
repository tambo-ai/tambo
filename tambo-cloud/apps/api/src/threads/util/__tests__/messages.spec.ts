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
import { ThreadMessageDto } from "../../dto/message.dto";
import {
  addAssistantMessageToThread,
  addMessage,
  updateMessage,
  verifyLatestMessageConsistency,
} from "../messages";

jest.mock("@tambo-ai-cloud/db", () => ({
  operations: {
    addMessage: jest.fn(),
    updateMessage: jest.fn(),
  },
  schema: {
    messages: {
      threadId: { name: "threadId" },
    },
  },
}));

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
        role: MessageRole.User,
        content: [{ type: "text" as ContentPartType.Text, text: "Hello" }],
        createdAt: new Date(),
        componentState: {},
        metadata: null,
        toolCallId: null,
        toolCallRequest: null,
        componentDecision: null,
        actionType: null,
      };

      jest.mocked(operations.addMessage).mockResolvedValue(mockResponse);

      const result = await addMessage(mockDb, "thread1", message);

      expect(operations.addMessage).toHaveBeenCalledWith(mockDb, {
        threadId: "thread1",
        role: MessageRole.User,
        content: [{ type: "text" as ContentPartType.Text, text: "Hello" }],
        componentDecision: undefined,
        metadata: undefined,
        actionType: undefined,
        toolCallRequest: undefined,
        toolCallId: undefined,
        componentState: {},
      });

      expect(result).toEqual({
        id: "msg1",
        threadId: "thread1",
        role: MessageRole.User,
        content: [{ type: "text" as ContentPartType.Text, text: "Hello" }],
        createdAt: mockResponse.createdAt,
        componentState: {},
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
        role: MessageRole.User,
        content: [
          { type: "text" as ContentPartType.Text, text: "Updated message" },
        ],
        createdAt: new Date(),
        componentState: {},
        actionType: null,
        metadata: null,
        toolCallId: null,
        toolCallRequest: null,
        componentDecision: null,
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
      });

      expect(result).toEqual({
        id: "msg1",
        threadId: "thread1",
        role: MessageRole.User,
        content: [
          { type: "text" as ContentPartType.Text, text: "Updated message" },
        ],
        createdAt: mockResponse.createdAt,
        componentState: {},
        toolCallId: null,
        toolCallRequest: undefined,
        tool_call_id: undefined,
        metadata: undefined,
        actionType: undefined,
        componentDecision: null,
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
        reasoning: "test reasoning",
      };

      const mockResponse = {
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
        role: MessageRole.User,
        content: [
          {
            type: "text" as ContentPartType.Text,
            text: "Latest message",
          },
        ] as ChatCompletionContentPart[],
        createdAt: new Date(),
        componentState: {},
        metadata: null,
        toolCallId: null,
        toolCallRequest: null,
        componentDecision: null,
        actionType: ActionType.ToolCall,
      };

      const newMessage: ThreadMessage = {
        ...mockMessage,
        componentState: {},
        actionType: ActionType.ToolCall,
        metadata: {},
        toolCallRequest: undefined,
        tool_call_id: undefined,
      };

      jest
        .mocked(mockDb.query.messages.findMany)
        .mockResolvedValue([mockMessage]);
      jest.mocked(operations.updateMessage).mockResolvedValue(mockMessage);

      await verifyLatestMessageConsistency(mockDb, "thread1", newMessage);

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
          addedUserMessage,
        ),
      ).rejects.toThrow(
        "Latest message before write is not the same as the added user message",
      );
    });
  });
});
