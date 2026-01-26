import { V1RunStatus, GenerationStage } from "@tambo-ai-cloud/core";
import {
  roleToV1,
  threadToDto,
  messageToDto,
  contentToV1Blocks,
  contentPartToV1Block,
  DbThread,
  DbMessage,
} from "../v1-conversions";

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
      metadata: { key: "value" },
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    it("should convert basic thread fields", () => {
      const result = threadToDto(baseThread);

      expect(result.id).toBe("thr_123");
      expect(result.contextKey).toBe("user_456");
      expect(result.runStatus).toBe(V1RunStatus.IDLE);
      expect(result.metadata).toEqual({ key: "value" });
      expect(result.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(result.updatedAt).toBe("2024-01-01T00:00:00.000Z");
    });

    it("should convert null values to undefined", () => {
      const result = threadToDto(baseThread);

      expect(result.currentRunId).toBeUndefined();
      expect(result.statusMessage).toBeUndefined();
      expect(result.lastRunCancelled).toBeUndefined();
      expect(result.lastRunError).toBeUndefined();
      expect(result.pendingToolCallIds).toBeUndefined();
      expect(result.lastCompletedRunId).toBeUndefined();
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

    it("should add component block when componentDecision exists", () => {
      const message = {
        ...baseMessage,
        content: [{ type: "text", text: "Here is a card" }],
        componentDecision: {
          componentName: "WeatherCard",
          props: { temperature: 72 },
          message: "",
          componentState: null,
        },
        componentState: { expanded: true },
      } as unknown as DbMessage;

      const result = contentToV1Blocks(message);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: "text", text: "Here is a card" });
      expect(result[1]).toEqual({
        type: "component",
        id: "comp_msg_123",
        name: "WeatherCard",
        props: { temperature: 72 },
        state: { expanded: true },
      });
    });

    it("should throw error when componentDecision has no componentName", () => {
      const message = {
        ...baseMessage,
        componentDecision: {
          componentName: null,
          props: { foo: "bar" },
          message: "",
          componentState: null,
        },
      } as unknown as DbMessage;

      expect(() => contentToV1Blocks(message)).toThrow(
        /Component decision in message msg_123 has no componentName/,
      );
    });

    it("should handle component with null props", () => {
      const message = {
        ...baseMessage,
        componentDecision: {
          componentName: "SimpleCard",
          props: null,
          message: "",
          componentState: null,
        },
      } as unknown as DbMessage;

      const result = contentToV1Blocks(message);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "component",
        id: "comp_msg_123",
        name: "SimpleCard",
        props: {},
        state: undefined,
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
  });
});
