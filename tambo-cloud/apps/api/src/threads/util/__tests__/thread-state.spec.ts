import { operations } from "@tambo-ai-cloud/db";

import { Logger } from "@nestjs/common";
import {
  ChatCompletionContentPart,
  ContentPartType,
  GenerationStage,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { HydraDb } from "@tambo-ai-cloud/db";
import { SQL } from "drizzle-orm";
import { PgTable, PgTransaction } from "drizzle-orm/pg-core";
import { ThreadMessageDto } from "src/threads/dto/message.dto";
import {
  addUserMessage,
  convertDecisionStreamToMessageStream,
  finishInProgressMessage,
  updateGenerationStage,
} from "../thread-state";

const schema = jest.requireActual("@tambo-ai-cloud/db").schema;

jest.mock("@tambo-ai-cloud/db", () => {
  const schema = jest.requireActual("@tambo-ai-cloud/db").schema;

  return {
    operations: {
      updateThread: jest.fn(),
      updateMessage: jest.fn(),
    },
    schema,
  };
});

describe("Thread State", () => {
  let mockDb: HydraDb;
  let mockLogger: Logger;

  beforeEach(() => {
    mockDb = {
      transaction: jest.fn(),
      query: {
        threads: {
          findFirst: jest.fn(),
        },
        messages: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
      },
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{}]),
          }),
        }),
      }),
      schema,
      nestedIndex: 0,
      rollback: jest.fn(),
      setTransaction: jest.fn(),
    } as unknown as HydraDb;

    mockLogger = {
      error: jest.fn(),
    } as unknown as Logger;
  });

  describe("updateGenerationStage", () => {
    it("should update thread generation stage", async () => {
      const now = new Date();
      jest.mocked(operations.updateThread).mockResolvedValue({
        id: "thread-1",
        messages: [],
        projectId: "project-1",
        contextKey: null,
        metadata: null,
        generationStage: GenerationStage.CHOOSING_COMPONENT,
        statusMessage: "Test status",
        createdAt: now,
        updatedAt: now,
      });
      jest
        .mocked(
          mockDb
            .update({} as PgTable)
            .set({})
            .where({} as SQL).returning,
        )
        .mockResolvedValue([{ success: true }]);
      jest.mocked(mockDb.query.messages.findMany).mockResolvedValue([]);
      await updateGenerationStage(
        mockDb,
        "thread-1",
        GenerationStage.CHOOSING_COMPONENT,
        "Test status",
      );

      expect(operations.updateThread).toHaveBeenCalledWith(mockDb, "thread-1", {
        generationStage: GenerationStage.CHOOSING_COMPONENT,
        statusMessage: "Test status",
      });
    });
  });

  describe("addUserMessage", () => {
    it("should throw error if thread is already processing", async () => {
      const now = new Date();
      const mockThread = {
        id: "thread-1",
        generationStage: GenerationStage.STREAMING_RESPONSE,
        createdAt: now,
        updatedAt: now,
        projectId: "project-1",
        contextKey: null,
        metadata: null,
        statusMessage: null,
      };

      const mockTransaction = {
        ...mockDb,
        schema,
        nestedIndex: 0,
        rollback: jest.fn(),
        setTransaction: jest.fn(),
      } as unknown as PgTransaction<any, any, any>;

      jest.mocked(mockDb.query.threads.findFirst).mockResolvedValue(mockThread);
      jest
        .mocked(mockDb.transaction)
        .mockImplementation(
          async (callback) => await callback(mockTransaction),
        );

      await expect(
        addUserMessage(
          mockDb,
          "thread-1",
          {
            role: MessageRole.User,
            content: [{ type: ContentPartType.Text, text: "test" }],
            componentState: {},
          },

          mockLogger,
        ),
      ).rejects.toThrow("Thread is already in processing");
    });
  });

  describe("convertDecisionStreamToMessageStream", () => {
    it("should convert decision stream to message stream", async () => {
      const mockDecisions: LegacyComponentDecision[] = [
        {
          message: "Test message",
          componentName: "test-component",
          props: {},
          componentState: {},
          reasoning: "test reasoning",
        },
      ];

      const mockInProgressMessage: ThreadMessage = {
        id: "msg-1",
        threadId: "thread-1",
        role: MessageRole.Assistant,
        content: [
          {
            type: ContentPartType.Text,
            text: "initial",
          } as ChatCompletionContentPart,
        ],
        createdAt: new Date(),
        componentState: {},
      };

      const stream = {
        async *[Symbol.asyncIterator]() {
          for (const decision of mockDecisions) {
            yield decision;
          }
        },
      };

      const messageStream = convertDecisionStreamToMessageStream(
        stream as AsyncIterableIterator<LegacyComponentDecision>,
        mockInProgressMessage,
      );

      const messages: ThreadMessageDto[] = [];
      for await (const message of messageStream) {
        messages.push(message);
      }

      expect(messages.length).toBe(2); // One for the stream chunk, one for final message
      expect(messages[0].content[0].type).toBe(ContentPartType.Text);
      expect((messages[0].content[0] as any).text).toBe("Test message");
    });
  });

  describe("finishInProgressMessage", () => {
    it("should update message and generation stage", async () => {
      const now = new Date();
      const mockFinalMessage: ThreadMessageDto = {
        id: "msg-2",
        threadId: "thread-1",
        role: MessageRole.Assistant,
        content: [
          {
            type: ContentPartType.Text,
            text: "final",
          },
        ],
        toolCallRequest: undefined,
        componentState: {},
        createdAt: now,
      };

      const mockUserMessage: typeof schema.messages.$inferSelect = {
        id: "msg-1",
        threadId: "thread-1",
        role: MessageRole.User,
        content: [{ type: ContentPartType.Text, text: "test" }],
        componentState: {},
        createdAt: now,
        metadata: null,
        toolCallRequest: null,
        toolCallId: null,
        componentDecision: null,
        actionType: null,
      };
      // this is the message that is being streamed
      const mockAssistantMessage: typeof schema.messages.$inferSelect = {
        id: "msg-2",
        threadId: "thread-1",
        role: MessageRole.Assistant,
        content: [{ type: ContentPartType.Text, text: "initial" }],
        componentState: {},
        createdAt: now,
        metadata: null,
        toolCallId: null,
        componentDecision: null,
        actionType: null,
        toolCallRequest: null,
      };

      const mockTransaction = {
        ...mockDb,
        schema,
        nestedIndex: 0,
        rollback: jest.fn(),
        setTransaction: jest.fn(),
      } as unknown as PgTransaction<any, any, any>;

      jest
        .mocked(mockDb.transaction)
        .mockImplementation(
          async (callback) => await callback(mockTransaction),
        );
      jest
        .mocked(mockDb.query.messages.findMany)
        .mockResolvedValue([mockAssistantMessage, mockUserMessage]);
      jest.mocked(operations.updateMessage).mockResolvedValue({
        ...mockFinalMessage,
        content: mockFinalMessage.content as ChatCompletionContentPart[],
        toolCallId: null,
        componentDecision: null,
        actionType: null,
        metadata: null,
        toolCallRequest: null,
      });

      const result = await finishInProgressMessage(
        mockDb,
        "thread-1",
        {
          id: "msg-1",
          threadId: "thread-2",
          role: MessageRole.User,
          content: [
            {
              type: ContentPartType.Text,
              text: "test",
            },
          ],
          createdAt: now,
          componentState: {},
        },
        "msg-2",
        mockFinalMessage,
        mockLogger,
      );

      expect(result.resultingGenerationStage).toBe(GenerationStage.COMPLETE);
      expect(result.resultingStatusMessage).toBe("Complete");
    });
  });
});
