import {
  V1RunStatus,
  GenerationStage,
  MessageRole,
  ContentPartType,
} from "@tambo-ai-cloud/core";
import {
  roleToV1,
  threadToDto,
  messageToDto,
  contentToV1Blocks,
  contentPartToV1Block,
  convertV1InputMessageToInternal,
  convertV1InitialMessageToMessageRequest,
  DbThread,
  DbMessage,
  V1InputMessage,
  V1InitialMessage,
} from "../v1-conversions";
import { V1ThreadDto } from "../dto/thread.dto";

describe("v1-conversions", () => {
  describe("roleToV1", () => {
    it("should return 'user' for user role", () => {
      expect(roleToV1("user")).toBe("user");
    });

    it("should return 'assistant' for assistant role", () => {
      expect(roleToV1("assistant")).toBe("assistant");
    });

    it("should return 'system' for system role", () => {
      expect(roleToV1("system")).toBe("system");
    });

    it("should convert 'tool' role to 'assistant'", () => {
      expect(roleToV1("tool")).toBe("assistant");
    });

    it("should throw error for unknown role", () => {
      expect(() => roleToV1("invalid_role")).toThrow(
        /Unknown message role "invalid_role"/,
      );
    });
  });

  describe("threadToDto", () => {
    const baseThread: DbThread = {
      id: "thr_123",
      projectId: "prj_123",
      contextKey: "user_456",
      name: null,
      generationStage: GenerationStage.IDLE,
      runStatus: V1RunStatus.IDLE,
      currentRunId: null,
      statusMessage: null,
      lastRunCancelled: null,
      lastRunError: null,
      pendingToolCallIds: null,
      lastCompletedRunId: null,
      sdkVersion: null,
      metadata: { key: "value" },
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    it("should convert basic thread fields", () => {
      const result = threadToDto(baseThread);

      expect(result.id).toBe("thr_123");
      expect(result.userKey).toBe("user_456");
      expect(result.runStatus).toBe(V1RunStatus.IDLE);
      expect(result.metadata).toEqual({ key: "value" });
      expect(result.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(result.updatedAt).toBe("2024-01-01T00:00:00.000Z");
    });

    it("should convert null values to undefined", () => {
      const result = threadToDto(baseThread);

      expect(result.name).toBeUndefined();
      expect(result.currentRunId).toBeUndefined();
      expect(result.statusMessage).toBeUndefined();
      expect(result.lastRunCancelled).toBeUndefined();
      expect(result.lastRunError).toBeUndefined();
      expect(result.pendingToolCallIds).toBeUndefined();
      expect(result.lastCompletedRunId).toBeUndefined();
    });

    it("should include name when present", () => {
      const threadWithName: DbThread = {
        ...baseThread,
        name: "My conversation",
      };

      const result = threadToDto(threadWithName);

      expect(result.name).toBe("My conversation");
    });

    it("should convert V1 run fields when present", () => {
      const threadWithRunFields: DbThread = {
        ...baseThread,
        runStatus: V1RunStatus.STREAMING,
        currentRunId: "run_123",
        statusMessage: "Processing...",
        lastRunCancelled: true,
        pendingToolCallIds: ["call_1", "call_2"],
        lastCompletedRunId: "run_prev",
      };

      const result = threadToDto(threadWithRunFields);

      expect(result.runStatus).toBe(V1RunStatus.STREAMING);
      expect(result.currentRunId).toBe("run_123");
      expect(result.statusMessage).toBe("Processing...");
      expect(result.lastRunCancelled).toBe(true);
      expect(result.pendingToolCallIds).toEqual(["call_1", "call_2"]);
      expect(result.lastCompletedRunId).toBe("run_prev");
    });

    it("should convert lastRunError correctly", () => {
      const threadWithError: DbThread = {
        ...baseThread,
        lastRunError: {
          code: "RATE_LIMITED",
          message: "Too many requests",
        },
      };

      const result = threadToDto(threadWithError);

      expect(result.lastRunError).toEqual({
        code: "RATE_LIMITED",
        message: "Too many requests",
      });
    });
  });

  describe("V1ThreadDto", () => {
    it("should support optional name field", () => {
      const dto = new V1ThreadDto();
      expect(dto.name).toBeUndefined();
      dto.name = "My thread";
      expect(dto.name).toBe("My thread");
    });
  });

  describe("contentPartToV1Block", () => {
    it("should convert text content", () => {
      const part = { type: "text" as const, text: "Hello world" };
      const result = contentPartToV1Block(part);

      expect(result).toEqual({ type: "text", text: "Hello world" });
    });

    it("should convert resource content", () => {
      const part = {
        type: "resource",
        resource: {
          uri: "https://example.com/file.pdf",
          mimeType: "application/pdf",
        },
      } as unknown as Parameters<typeof contentPartToV1Block>[0];
      const result = contentPartToV1Block(part);

      expect(result).toEqual({
        type: "resource",
        resource: {
          uri: "https://example.com/file.pdf",
          mimeType: "application/pdf",
        },
      });
    });

    it("should convert image_url to resource format", () => {
      const part = {
        type: "image_url" as const,
        image_url: { url: "https://example.com/image.png" },
      };
      const result = contentPartToV1Block(part);

      expect(result).toEqual({
        type: "resource",
        resource: {
          uri: "https://example.com/image.png",
          mimeType: "image/*",
        },
      });
    });

    it("should return null for unknown content types", () => {
      const part = { type: "unknown_type", data: "something" } as unknown;
      expect(() =>
        contentPartToV1Block(
          part as Parameters<typeof contentPartToV1Block>[0],
        ),
      ).toThrow(/Unknown content part type/);
    });

    it("should call onUnknownContentType callback for unknown types", () => {
      const onUnknownContentType = jest.fn();
      const part = { type: "future_type", data: "something" } as unknown;

      contentPartToV1Block(part as Parameters<typeof contentPartToV1Block>[0], {
        onUnknownContentType,
      });

      expect(onUnknownContentType).toHaveBeenCalledWith({
        type: "future_type",
      });
    });

    it("should handle missing text gracefully", () => {
      const part = { type: "text" as const };
      const result = contentPartToV1Block(
        part as Parameters<typeof contentPartToV1Block>[0],
      );

      expect(result).toEqual({ type: "text", text: "" });
    });

    it("should handle missing image_url gracefully", () => {
      const part = { type: "image_url" as const };
      const onInvalidContentPart = jest.fn();
      const result = contentPartToV1Block(
        part as Parameters<typeof contentPartToV1Block>[0],
        { onInvalidContentPart },
      );

      expect(result).toBeNull();
      expect(onInvalidContentPart).toHaveBeenCalledWith({
        type: "image_url",
        reason: "missing url",
      });
    });
  });

  describe("contentToV1Blocks", () => {
    // Use 'as unknown as DbMessage' to create test data that matches runtime shape
    // without fighting with strict TypeScript inference on database types
    const baseMessage = {
      id: "msg_123",
      threadId: "thr_123",
      role: "user",
      content: [],
      componentDecision: null,
      componentState: null,
      metadata: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    } as unknown as DbMessage;

    it("should convert empty content array", () => {
      const result = contentToV1Blocks(baseMessage);
      expect(result).toEqual([]);
    });

    it("should convert multiple content parts", () => {
      const message = {
        ...baseMessage,
        content: [
          { type: "text", text: "Hello" },
          { type: "text", text: "World" },
        ],
      } as unknown as DbMessage;

      const result = contentToV1Blocks(message);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: "text", text: "Hello" });
      expect(result[1]).toEqual({ type: "text", text: "World" });
    });

    it("should skip unknown content types", () => {
      const onUnknownContentType = jest.fn();
      const message = {
        ...baseMessage,
        content: [
          { type: "text", text: "Hello" },
          { type: "unknown_type", data: "something" },
          { type: "text", text: "World" },
        ],
      } as unknown as DbMessage;

      const result = contentToV1Blocks(message, { onUnknownContentType });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: "text", text: "Hello" });
      expect(result[1]).toEqual({ type: "text", text: "World" });

      expect(onUnknownContentType).toHaveBeenCalledWith({
        type: "unknown_type",
      });
    });

    it("should preserve inline tool_use blocks in their natural position", () => {
      const message = {
        ...baseMessage,
        role: "assistant",
        content: [
          { type: "text", text: "Let me search for that." },
          {
            type: "tool_use",
            id: "call_abc",
            name: "search",
            input: { query: "weather" },
          },
          { type: "text", text: "Here are the results." },
        ],
        toolCallRequest: {
          toolName: "search",
          parameters: [{ parameterName: "query", parameterValue: "weather" }],
        },
        toolCallId: "call_abc",
      } as unknown as DbMessage;

      const result = contentToV1Blocks(message);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        type: "text",
        text: "Let me search for that.",
      });
      expect(result[1]).toEqual({
        type: "tool_use",
        id: "call_abc",
        name: "search",
        input: { query: "weather" },
      });
      expect(result[2]).toEqual({
        type: "text",
        text: "Here are the results.",
      });
    });

    it("should skip malformed tool_use blocks with non-string id or name", () => {
      const message = {
        ...baseMessage,
        role: "assistant",
        content: [
          { type: "text", text: "Before" },
          { type: "tool_use", id: 123, name: "get_data", input: {} },
          { type: "text", text: "After" },
        ],
      } as unknown as DbMessage;

      const result = contentToV1Blocks(message);

      // Malformed tool_use is skipped, only text blocks remain
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: "text", text: "Before" });
      expect(result[1]).toEqual({ type: "text", text: "After" });
    });

    it("should default to empty input when tool_use input is not an object", () => {
      const message = {
        ...baseMessage,
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "call_bad_input",
            name: "get_data",
            input: "not-an-object",
          },
        ],
      } as unknown as DbMessage;

      const result = contentToV1Blocks(message);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "tool_use",
        id: "call_bad_input",
        name: "get_data",
        input: {},
      });
    });

    it("should preserve inline tool_result blocks in their natural position", () => {
      const message = {
        ...baseMessage,
        role: "assistant",
        content: [
          { type: "text", text: "Before" },
          {
            type: "tool_result",
            toolUseId: "call_abc",
            content: [{ type: "text", text: "Result data" }],
          },
          { type: "text", text: "After" },
        ],
      } as unknown as DbMessage;

      const result = contentToV1Blocks(message);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: "text", text: "Before" });
      expect(result[1]).toEqual({
        type: "tool_result",
        toolUseId: "call_abc",
        content: [{ type: "text", text: "Result data" }],
        isError: undefined,
      });
      expect(result[2]).toEqual({ type: "text", text: "After" });
    });

    it("should enrich inline tool_use with _tambo_ display properties from componentDecision", () => {
      const message = {
        ...baseMessage,
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "call_enriched",
            name: "fetch_data",
            input: { url: "https://example.com" },
          },
        ],
        toolCallRequest: {
          toolName: "fetch_data",
          parameters: [
            { parameterName: "url", parameterValue: "https://example.com" },
          ],
        },
        toolCallId: "call_enriched",
        componentDecision: {
          componentName: null,
          statusMessage: "Fetching data...",
          completionStatusMessage: "Done fetching",
          props: {},
          message: "",
          componentState: null,
        },
      } as unknown as DbMessage;

      const result = contentToV1Blocks(message);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "tool_use",
        id: "call_enriched",
        name: "fetch_data",
        input: {
          url: "https://example.com",
          _tambo_statusMessage: "Fetching data...",
          _tambo_completionStatusMessage: "Done fetching",
        },
      });
    });
  });

  describe("messageToDto", () => {
    const baseMessage = {
      id: "msg_123",
      threadId: "thr_123",
      role: "user",
      content: [{ type: "text", text: "Hello" }],
      componentDecision: null,
      componentState: null,
      metadata: { custom: "data" },
      createdAt: new Date("2024-01-01T00:00:00Z"),
    } as unknown as DbMessage;

    it("should convert basic message fields", () => {
      const result = messageToDto(baseMessage);

      expect(result.id).toBe("msg_123");
      expect(result.role).toBe("user");
      expect(result.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(result.metadata).toEqual({ custom: "data" });
    });

    it("should convert content to V1 blocks", () => {
      const result = messageToDto(baseMessage);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({ type: "text", text: "Hello" });
    });

    it("should convert tool role to assistant", () => {
      const message = { ...baseMessage, role: "tool" } as unknown as DbMessage;
      const result = messageToDto(message);

      expect(result.role).toBe("assistant");
    });

    it("should throw for unknown role", () => {
      const message = {
        ...baseMessage,
        role: "invalid",
      } as unknown as DbMessage;

      expect(() => messageToDto(message)).toThrow(
        /Unknown message role "invalid"/,
      );
    });

    it("should pass options to content conversion", () => {
      const onUnknownContentType = jest.fn();
      const message = {
        ...baseMessage,
        content: [{ type: "future_type", data: "x" }],
      } as unknown as DbMessage;

      messageToDto(message, { onUnknownContentType });

      expect(onUnknownContentType).toHaveBeenCalledWith({
        type: "future_type",
      });
    });

    it("should convert null metadata to undefined", () => {
      const message = {
        ...baseMessage,
        metadata: null,
      } as unknown as DbMessage;
      const result = messageToDto(message);

      expect(result.metadata).toBeUndefined();
    });

    it("should include isCancelled when message is cancelled", () => {
      const message = {
        ...baseMessage,
        isCancelled: true,
      } as unknown as DbMessage;
      const result = messageToDto(message);

      expect(result.isCancelled).toBe(true);
    });

    it("should omit isCancelled when message is not cancelled", () => {
      const message = {
        ...baseMessage,
        isCancelled: false,
      } as unknown as DbMessage;
      const result = messageToDto(message);

      expect(result.isCancelled).toBeUndefined();
    });

    it("should omit isCancelled when field is null/undefined", () => {
      const message = {
        ...baseMessage,
        isCancelled: null,
      } as unknown as DbMessage;
      const result = messageToDto(message);

      expect(result.isCancelled).toBeUndefined();
    });

    it("should include parentMessageId when present", () => {
      const message = {
        ...baseMessage,
        parentMessageId: "parent_msg_456",
      } as unknown as DbMessage;
      const result = messageToDto(message);

      expect(result.parentMessageId).toBe("parent_msg_456");
    });

    it("should omit parentMessageId when null", () => {
      const message = {
        ...baseMessage,
        parentMessageId: null,
      } as unknown as DbMessage;
      const result = messageToDto(message);

      expect(result.parentMessageId).toBeUndefined();
    });
  });

  describe("convertV1InputMessageToInternal", () => {
    it("should convert text content to internal format", () => {
      const input: V1InputMessage = {
        role: "user",
        content: [{ type: "text", text: "Hello world" }],
      };

      const result = convertV1InputMessageToInternal(input);

      expect(result.role).toBe(MessageRole.User);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: ContentPartType.Text,
        text: "Hello world",
      });
      expect(result.additionalContext).toBeUndefined();
    });

    it("should convert resource content to internal format", () => {
      const input: V1InputMessage = {
        role: "user",
        content: [
          {
            type: "resource",
            resource: {
              uri: "https://example.com/file.pdf",
              mimeType: "application/pdf",
            },
          },
        ],
      };

      const result = convertV1InputMessageToInternal(input);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: ContentPartType.Resource,
        resource: {
          uri: "https://example.com/file.pdf",
          mimeType: "application/pdf",
        },
      });
    });

    it("should pass additionalContext through to internal message", () => {
      const additionalContext = {
        currentPage: "/dashboard",
        userPreferences: { theme: "dark" },
        nestedObject: { deeply: { nested: { value: 123 } } },
      };

      const input: V1InputMessage = {
        role: "user",
        content: [{ type: "text", text: "Hi" }],
        additionalContext,
      };

      const result = convertV1InputMessageToInternal(input);

      expect(result.additionalContext).toEqual(additionalContext);
      expect(result.additionalContext?.currentPage).toBe("/dashboard");
      expect(result.additionalContext?.userPreferences).toEqual({
        theme: "dark",
      });
      expect(result.additionalContext?.nestedObject).toEqual({
        deeply: { nested: { value: 123 } },
      });
    });

    it("should work without additionalContext (backward compatible)", () => {
      const input: V1InputMessage = {
        role: "user",
        content: [{ type: "text", text: "Hi" }],
      };

      const result = convertV1InputMessageToInternal(input);

      expect(result.additionalContext).toBeUndefined();
      expect(result.role).toBe(MessageRole.User);
      expect(result.content).toHaveLength(1);
    });

    it("should filter out tool_result blocks", () => {
      const input: V1InputMessage = {
        role: "user",
        content: [
          { type: "text", text: "Hello" },
          {
            type: "tool_result",
            toolCallId: "call_123",
            result: { data: "result" },
          } as unknown as V1InputMessage["content"][0],
          { type: "text", text: "World" },
        ],
      };

      const result = convertV1InputMessageToInternal(input);

      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({
        type: ContentPartType.Text,
        text: "Hello",
      });
      expect(result.content[1]).toEqual({
        type: ContentPartType.Text,
        text: "World",
      });
    });

    it("should convert multiple content blocks", () => {
      const input: V1InputMessage = {
        role: "user",
        content: [
          { type: "text", text: "Check this file:" },
          {
            type: "resource",
            resource: {
              uri: "https://example.com/doc.pdf",
              mimeType: "application/pdf",
            },
          },
        ],
      };

      const result = convertV1InputMessageToInternal(input);

      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe(ContentPartType.Text);
      expect(result.content[1].type).toBe(ContentPartType.Resource);
    });

    it("should throw for unknown content types", () => {
      const input: V1InputMessage = {
        role: "user",
        content: [
          {
            type: "unknown_type",
            data: "something",
          } as unknown as V1InputMessage["content"][0],
        ],
      };

      expect(() => convertV1InputMessageToInternal(input)).toThrow(
        /Unknown content type: unknown_type/,
      );
    });

    it("should handle empty additionalContext object", () => {
      const input: V1InputMessage = {
        role: "user",
        content: [{ type: "text", text: "Hi" }],
        additionalContext: {},
      };

      const result = convertV1InputMessageToInternal(input);

      expect(result.additionalContext).toEqual({});
    });
  });

  describe("convertV1InitialMessageToMessageRequest", () => {
    it("should convert a user role message", () => {
      const input: V1InitialMessage = {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      };

      const result = convertV1InitialMessageToMessageRequest(input);

      expect(result.role).toBe(MessageRole.User);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: ContentPartType.Text,
        text: "Hello",
      });
    });

    it("should convert a system role message", () => {
      const input: V1InitialMessage = {
        role: "system",
        content: [{ type: "text", text: "You are a helpful assistant" }],
      };

      const result = convertV1InitialMessageToMessageRequest(input);

      expect(result.role).toBe(MessageRole.System);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: ContentPartType.Text,
        text: "You are a helpful assistant",
      });
    });

    it("should convert an assistant role message", () => {
      const input: V1InitialMessage = {
        role: "assistant",
        content: [{ type: "text", text: "How can I help?" }],
      };

      const result = convertV1InitialMessageToMessageRequest(input);

      expect(result.role).toBe(MessageRole.Assistant);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: ContentPartType.Text,
        text: "How can I help?",
      });
    });

    it("should convert resource content", () => {
      const input: V1InitialMessage = {
        role: "user",
        content: [
          {
            type: "resource",
            resource: {
              uri: "https://example.com/file.pdf",
              mimeType: "application/pdf",
            },
          },
        ],
      };

      const result = convertV1InitialMessageToMessageRequest(input);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: ContentPartType.Resource,
        resource: {
          uri: "https://example.com/file.pdf",
          mimeType: "application/pdf",
        },
      });
    });

    it("should pass metadata through", () => {
      const input: V1InitialMessage = {
        role: "user",
        content: [{ type: "text", text: "Hi" }],
        metadata: { key: "value" },
      };

      const result = convertV1InitialMessageToMessageRequest(input);

      expect(result.metadata).toEqual({ key: "value" });
    });

    it("should throw for unknown content types", () => {
      const input: V1InitialMessage = {
        role: "user",
        content: [
          {
            type: "unknown_type",
            data: "something",
          } as unknown as V1InitialMessage["content"][0],
        ],
      };

      expect(() => convertV1InitialMessageToMessageRequest(input)).toThrow(
        /Unknown content type in initial message: unknown_type/,
      );
    });

    it("should convert multiple content blocks", () => {
      const input: V1InitialMessage = {
        role: "user",
        content: [
          { type: "text", text: "Check this:" },
          {
            type: "resource",
            resource: {
              uri: "https://example.com/doc.pdf",
              mimeType: "application/pdf",
            },
          },
        ],
      };

      const result = convertV1InitialMessageToMessageRequest(input);

      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe(ContentPartType.Text);
      expect(result.content[1].type).toBe(ContentPartType.Resource);
    });
  });
});
