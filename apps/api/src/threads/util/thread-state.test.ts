import { operations } from "@tambo-ai-cloud/db";

import { Logger } from "@nestjs/common";
import {
  ActionType,
  ChatCompletionContentPart,
  ContentPartType,
  GenerationStage,
  UI_TOOLNAME_PREFIX,
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
} from "./thread-state";

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

    it("should set outer tool call fields when chunk includes tool call and isToolCallFinished is true", () => {
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
        isToolCallFinished: true,
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

      // Tool call info should also be in component field
      expect(threadMessage.component?.toolCallRequest).toEqual(toolCallRequest);
      expect(threadMessage.component?.toolCallId).toBe("tool-123");
    });

    it("should set outer tool call fields for UI tools during streaming, but not for non-UI tools", () => {
      // Test UI tool (show_component_ prefix)
      const uiToolCallRequest = {
        toolName: UI_TOOLNAME_PREFIX + "Graph",
        parameters: [{ parameterName: "data", parameterValue: [1, 2, 3] }],
      };

      const mockUIDecisionInProgress: LegacyComponentDecision = {
        id: "dec-1",
        message: "Showing graph",
        componentName: "Graph",
        props: { data: [1, 2, 3] },
        componentState: {},
        reasoning: ["test reasoning"],
        toolCallRequest: uiToolCallRequest,
        toolCallId: "tool-ui-123",
        isToolCallFinished: false, // Not finished yet, but should still set fields for UI tools
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

      const uiThreadMessage = updateThreadMessageFromLegacyDecision(
        mockInProgressMessage,
        mockUIDecisionInProgress,
      );

      // UI tools should set outer fields immediately during streaming
      expect(uiThreadMessage.toolCallRequest).toEqual(uiToolCallRequest);
      expect(uiThreadMessage.tool_call_id).toBe("tool-ui-123");
      expect(uiThreadMessage.actionType).toBe(ActionType.ToolCall);

      // Test non-UI tool (no show_component_ prefix)
      const nonUIToolCallRequest = {
        toolName: "get_weather",
        parameters: [{ parameterName: "city", parameterValue: "SF" }],
      };

      const mockNonUIDecisionInProgress: LegacyComponentDecision = {
        id: "dec-2",
        message: "Getting weather",
        componentName: "",
        props: null,
        componentState: {},
        reasoning: ["test reasoning"],
        toolCallRequest: nonUIToolCallRequest,
        toolCallId: "tool-nonui-456",
        isToolCallFinished: false, // Not finished - should NOT set fields for non-UI tools
      };

      const nonUIThreadMessage = updateThreadMessageFromLegacyDecision(
        mockInProgressMessage,
        mockNonUIDecisionInProgress,
      );

      // Non-UI tools should NOT set outer fields until finished
      expect(nonUIThreadMessage.toolCallRequest).toBeUndefined();
      expect(nonUIThreadMessage.tool_call_id).toBeUndefined();
      expect(nonUIThreadMessage.actionType).toBeUndefined();

      // But should set them when finished
      const mockNonUIDecisionFinished: LegacyComponentDecision = {
        ...mockNonUIDecisionInProgress,
        isToolCallFinished: true,
      };

      const nonUIThreadMessageFinished = updateThreadMessageFromLegacyDecision(
        mockInProgressMessage,
        mockNonUIDecisionFinished,
      );

      // Now should set fields when finished
      expect(nonUIThreadMessageFinished.toolCallRequest).toEqual(
        nonUIToolCallRequest,
      );
      expect(nonUIThreadMessageFinished.tool_call_id).toBe("tool-nonui-456");
      expect(nonUIThreadMessageFinished.actionType).toBe(ActionType.ToolCall);
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

    it("preserves tool call info in chunks and marks completion status", async () => {
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

      expect(result).toHaveLength(4);
      // Streaming chunks preserve tool call info and mark as not finished
      expect(result[0].message).toBe("part1");
      expect(result[0].toolCallRequest).toBeUndefined(); // No tool call in this chunk
      expect(result[0].isToolCallFinished).toBe(false);

      expect(result[1].message).toBe("part2");
      expect(result[1].toolCallRequest).toBeDefined(); // Tool call info preserved
      expect(result[1].toolCallRequest?.toolName).toBe("toolA");
      expect(result[1].toolCallId).toBe("tc-1");
      expect(result[1].toolCallRequest?.parameters).toEqual([]);
      expect(result[1].isToolCallFinished).toBe(false); // Not finished yet

      expect(result[2].message).toBe("part3");
      expect(result[2].toolCallRequest).toBeDefined();
      expect(result[2].toolCallRequest?.toolName).toBe("toolA");
      expect(result[2].toolCallId).toBe("tc-1");
      expect(result[2].toolCallRequest?.parameters).toEqual([
        { parameterName: "param1", parameterValue: "value1" },
      ]);
      expect(result[2].isToolCallFinished).toBe(false); // Not finished yet

      // Final chunk has tool call info and is marked as finished
      expect(result[3].message).toBe("part3");
      expect(result[3].toolCallRequest).toBeDefined();
      expect(result[3].toolCallRequest?.toolName).toBe("toolA");
      expect(result[3].toolCallId).toBe("tc-1");
      expect(result[3].toolCallRequest?.parameters).toEqual([
        { parameterName: "param1", parameterValue: "value1" },
      ]);
      expect(result[3].isToolCallFinished).toBe(true); // Finished
    });

    it("emits final chunk when message id changes, then continues streaming", async () => {
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
      // 0: a1 (streaming, no tool call)
      // 1: a2 (streaming, has tool call, not finished)
      // 2: a2 final (finished, has tool call)
      // 3: b1 (streaming, no tool call)
      // 4: b2 (streaming, has tool call, not finished)
      // 5: b2 final (finished, has tool call)
      expect(result.map((r: any) => r.message)).toEqual([
        "a1",
        "a2",
        "a2",
        "b1",
        "b2",
        "b2",
      ]);

      // Streaming chunks preserve tool call info
      expect(result[1].toolCallRequest).toBeDefined();
      expect(result[1].toolCallId).toBe("tc-a");
      expect(result[1].isToolCallFinished).toBe(false);

      // Final chunk has tool call info and is marked finished
      expect(result[2].toolCallRequest).toBeDefined();
      expect(result[2].toolCallId).toBe("tc-a");
      expect(result[2].isToolCallFinished).toBe(true);

      // Streaming chunks preserve tool call info
      expect(result[4].toolCallRequest).toBeDefined();
      expect(result[4].toolCallId).toBe("tc-b");
      expect(result[4].isToolCallFinished).toBe(false);

      // Final chunk has tool call info and is marked finished
      expect(result[5].toolCallRequest).toBeDefined();
      expect(result[5].toolCallId).toBe("tc-b");
      expect(result[5].isToolCallFinished).toBe(true);
    });

    it("should preserve tool call info in streaming chunks and mark completion status", async () => {
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

      // Streaming chunks preserve tool call info and mark as not finished
      const streamingChunk1 = result[0];
      expect(streamingChunk1.toolCallRequest).toBeUndefined(); // No tool call in this chunk
      expect(streamingChunk1.isToolCallFinished).toBe(false);

      const streamingChunk2 = result[1];
      expect(streamingChunk2.toolCallRequest).toBeDefined(); // Tool call info preserved
      expect(streamingChunk2.toolCallRequest?.toolName).toBe("toolA");
      expect(streamingChunk2.toolCallId).toBe("tc-1");
      expect(streamingChunk2.isToolCallFinished).toBe(false); // Not finished yet

      const streamingChunk3 = result[2];
      expect(streamingChunk3.toolCallRequest).toBeDefined(); // Tool call info preserved (updated)
      expect(streamingChunk3.toolCallRequest?.toolName).toBe("toolA");
      expect(streamingChunk3.toolCallRequest?.parameters).toEqual([
        { parameterName: "param1", parameterValue: "value1" },
      ]);
      expect(streamingChunk3.toolCallId).toBe("tc-1");
      expect(streamingChunk3.isToolCallFinished).toBe(false); // Not finished yet

      // Final chunk has tool call info and is marked as finished
      const finalChunk = result[3];
      expect(finalChunk.toolCallRequest).toBeDefined();
      expect(finalChunk.toolCallRequest?.toolName).toBe("toolA");
      expect(finalChunk.toolCallRequest?.parameters).toEqual([
        { parameterName: "param1", parameterValue: "value1" },
      ]);
      expect(finalChunk.toolCallId).toBe("tc-1");
      expect(finalChunk.isToolCallFinished).toBe(true); // Finished
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
