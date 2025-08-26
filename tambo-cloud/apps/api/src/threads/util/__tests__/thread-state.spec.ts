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
import {
  addUserMessage,
  finishInProgressMessage,
  fixStreamedToolCalls,
  updateGenerationStage,
  updateThreadMessageFromLegacyDecision,
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
        name: "Test name",
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
        name: null,
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

  describe("updateThreadMessageFromLegacyDecision", () => {
    it("should convert decision stream to message stream", async () => {
      const mockDecision: LegacyComponentDecision = {
        message: "Test message",
        componentName: "test-component",
        props: {},
        componentState: {},
        reasoning: "test reasoning",
      };

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

      const threadMessage = updateThreadMessageFromLegacyDecision(
        mockInProgressMessage,
        mockDecision,
      );

      expect(threadMessage.content[0].type).toBe(ContentPartType.Text);
      expect(
        threadMessage.content[0].type === "text" &&
          threadMessage.content[0].text,
      ).toBe("Test message");
      // New behavior: do not set tool call fields when not provided
      expect(threadMessage.toolCallRequest).toBeUndefined();
      expect(threadMessage.tool_call_id).toBeUndefined();
      expect(threadMessage.actionType).toBeUndefined();
    });

    it("should set tool call fields when chunk includes tool call", () => {
      const toolCallRequest = {
        toolName: "myTool",
        parameters: [{ parameterName: "param1", parameterValue: "value1" }],
      };

      const mockDecisionWithTool: LegacyComponentDecision = {
        id: "dec-1",
        message: "With tool",
        componentName: "test-component",
        props: {},
        componentState: {},
        reasoning: "test reasoning",
        toolCallRequest,
        toolCallId: "tool-123",
      };

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

      const threadMessage = updateThreadMessageFromLegacyDecision(
        mockInProgressMessage,
        mockDecisionWithTool,
      );

      expect(threadMessage.toolCallRequest).toEqual(toolCallRequest);
      expect(threadMessage.tool_call_id).toBe("tool-123");
      expect(threadMessage.actionType).toBeDefined();
    });
  });

  describe("fixStreamedToolCalls", () => {
    function createDecision(
      id: string,
      message: string,
      tool?: { id: string; request: any },
    ): LegacyComponentDecision {
      return {
        id,
        message,
        componentName: "test-component",
        props: {},
        componentState: {},
        reasoning: "because",
        ...(tool ? { toolCallId: tool.id, toolCallRequest: tool.request } : {}),
      } as LegacyComponentDecision;
    }

    async function collect<T>(iter: AsyncIterableIterator<T>): Promise<T[]> {
      const out: T[] = [];
      for await (const v of iter) out.push(v);
      return out;
    }

    it("withholds tool calls until final chunk for a message id", async () => {
      async function* makeStream() {
        yield createDecision("a", "part1");
        yield createDecision("a", "part2", {
          id: "tc-1",
          request: {
            toolName: "toolA",
            parameters: [],
          },
        });
        yield createDecision("a", "part3");
      }

      const result = await collect(fixStreamedToolCalls(makeStream()));

      // New behavior: no synthesized final emission unless the final chunk
      // itself contains the tool call (id does not change in this test)
      expect(result).toHaveLength(3);
      // all streamed chunks should have tool calls withheld
      expect(result[0].message).toBe("part1");
      expect(result[0].toolCallRequest).toBeUndefined();
      expect(result[1].message).toBe("part2");
      expect(result[1].toolCallRequest).toBeUndefined();
      expect(result[2].message).toBe("part3");
      expect(result[2].toolCallRequest).toBeUndefined();
    });

    it("emits final tool call when message id changes, then continues streaming", async () => {
      async function* makeStream() {
        yield createDecision("a", "a1");
        yield createDecision("a", "a2", {
          id: "tc-a",
          request: { toolName: "toolA", parameters: [] },
        });
        // id switch here
        yield createDecision("b", "b1");
        yield createDecision("b", "b2", {
          id: "tc-b",
          request: { toolName: "toolB", parameters: [] },
        });
      }

      const result = await collect(fixStreamedToolCalls(makeStream()));

      // Sequence:
      // 0: a1 (incomplete)
      // 1: a2 (incomplete)
      // 2: synthesized a-final with tool (from tc-a on last a chunk)
      // 3: b1 (incomplete)
      // 4: b2 (incomplete)
      // 5: synthesized b-final with tool (end of stream)
      expect(result.map((r: any) => r.message)).toEqual([
        "a1",
        "a2",
        "a2",
        "b1",
        "b2",
        "b2",
      ]);

      expect(result[2].toolCallRequest).toBeDefined();
      expect(result[2].toolCallId).toBe("tc-a");
      expect(result[5].toolCallRequest).toBeDefined();
      expect(result[5].toolCallId).toBe("tc-b");
    });
  });

  describe("finishInProgressMessage", () => {
    it("should update message and generation stage", async () => {
      const now = new Date();
      const mockFinalMessage: ThreadMessage = {
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
        componentState: mockFinalMessage.componentState ?? {},
        toolCallId: null,
        componentDecision: null,
        actionType: null,
        metadata: null,
        toolCallRequest: null,
        error: null,
        isCancelled: false,
        additionalContext: null,
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
