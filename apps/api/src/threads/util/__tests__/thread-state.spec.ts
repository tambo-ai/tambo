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
  DecisionWithInternalToolInfo,
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
        reasoning: ["test reasoning"],
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
        reasoning: ["test reasoning"],
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

    it("should read tool call info from internal fields when outer fields are undefined", () => {
      const toolCallRequest = {
        toolName: "myTool",
        parameters: [{ parameterName: "param1", parameterValue: "value1" }],
      };

      // Simulate a streaming chunk with internal fields but no outer fields
      const mockDecisionWithInternalFields: DecisionWithInternalToolInfo = {
        id: "dec-1",
        message: "With tool in internal fields",
        componentName: "test-component",
        props: {},
        componentState: {},
        reasoning: ["test reasoning"],
        toolCallRequest: undefined, // Outer field is undefined
        toolCallId: undefined, // Outer field is undefined
        __toolCallRequest: toolCallRequest, // Internal field has the value
        __toolCallId: "tool-456", // Internal field has the value
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
        mockDecisionWithInternalFields,
      );

      // Should read from internal fields for component
      expect(threadMessage.component?.toolCallRequest).toEqual(toolCallRequest);
      expect(threadMessage.component?.toolCallId).toBe("tool-456");

      // Should NOT set outer fields when only internal fields are present
      // (this indicates it's a streaming chunk, not a final chunk)
      expect(threadMessage.toolCallRequest).toBeUndefined();
      expect(threadMessage.tool_call_id).toBeUndefined();
      expect(threadMessage.actionType).toBeUndefined();
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
        reasoning: ["because"],
        ...(tool ? { toolCallId: tool.id, toolCallRequest: tool.request } : {}),
      };
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

      // New behavior: final chunk has tool call info on outer fields
      expect(result).toHaveLength(4);
      // all streamed chunks should have tool calls withheld from outer fields
      expect(result[0].message).toBe("part1");
      expect(result[0].toolCallRequest).toBeUndefined();
      expect(result[1].message).toBe("part2");
      expect(result[1].toolCallRequest).toBeUndefined();
      expect(result[2].message).toBe("part3");
      expect(result[2].toolCallRequest).toBeUndefined();

      // Final chunk should have tool call info on outer fields
      expect(result[3].message).toBe("part3");
      expect(result[3].toolCallRequest).toBeDefined();
      expect(result[3].toolCallRequest?.toolName).toBe("toolA");
      expect(result[3].toolCallId).toBe("tc-1");
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

    it("should set internal fields on streaming chunks when tool call is present", async () => {
      async function* makeStream() {
        yield createDecision("a", "part1");
        yield createDecision("a", "part2", {
          id: "tc-1",
          request: {
            toolName: "toolA",
            parameters: [],
          },
        });
        yield createDecision("a", "part3", {
          id: "tc-1",
          request: {
            toolName: "toolA",
            parameters: [{ parameterName: "param1", parameterValue: "value1" }],
          },
        });
      }

      const result = await collect(fixStreamedToolCalls(makeStream()));

      // Streaming chunks should have internal fields set
      const streamingChunk1 = result[0];
      expect(streamingChunk1.toolCallRequest).toBeUndefined();
      expect(streamingChunk1.__toolCallRequest).toBeUndefined();

      const streamingChunk2 = result[1];
      expect(streamingChunk2.toolCallRequest).toBeUndefined();
      expect(streamingChunk2.__toolCallRequest).toBeDefined();
      expect(streamingChunk2.__toolCallRequest?.toolName).toBe("toolA");
      expect(streamingChunk2.__toolCallId).toBe("tc-1");

      const streamingChunk3 = result[2];
      expect(streamingChunk3.toolCallRequest).toBeUndefined();
      expect(streamingChunk3.__toolCallRequest).toBeDefined();
      expect(streamingChunk3.__toolCallRequest?.toolName).toBe("toolA");
      expect(streamingChunk3.__toolCallRequest?.parameters).toEqual([
        { parameterName: "param1", parameterValue: "value1" },
      ]);
      expect(streamingChunk3.__toolCallId).toBe("tc-1");

      // Final chunk should have outer fields
      const finalChunk = result[3];
      expect(finalChunk.toolCallRequest).toBeDefined();
      expect(finalChunk.toolCallRequest?.toolName).toBe("toolA");
      expect(finalChunk.toolCallRequest?.parameters).toEqual([
        { parameterName: "param1", parameterValue: "value1" },
      ]);
      expect(finalChunk.toolCallId).toBe("tc-1");
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
        parentMessageId: null,
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
        parentMessageId: null,
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
        content: mockFinalMessage.content,
        parentMessageId: null,
        componentState: mockFinalMessage.componentState ?? {},
        toolCallId: null,
        componentDecision: null,
        actionType: null,
        metadata: null,
        toolCallRequest: null,
        error: null,
        isCancelled: false,
        additionalContext: null,
        reasoning: null,
        reasoningDurationMS: null,
      });

      const result = await finishInProgressMessage(
        mockDb,
        "thread-1",
        "msg-1",
        "msg-2",
        mockFinalMessage,
        mockLogger,
      );

      expect(result.resultingGenerationStage).toBe(GenerationStage.COMPLETE);
      expect(result.resultingStatusMessage).toBe("Complete");
    });
  });
});
