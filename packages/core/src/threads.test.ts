import {
  isAssistantMessage,
  isSystemMessage,
  isToolMessage,
  isUserMessage,
  MessageRole,
  ThreadAssistantMessage,
  ThreadMessage,
  ThreadSystemMessage,
  ThreadToolMessage,
  ThreadUserMessage,
} from "./threads";

describe("threads type guards", () => {
  const baseMessage = {
    id: "msg-123",
    threadId: "thread-456",
    createdAt: new Date(),
  };

  const userMessage: ThreadUserMessage = {
    ...baseMessage,
    role: MessageRole.User,
    content: [{ type: "text", text: "Hello" }],
  };

  const assistantMessage: ThreadAssistantMessage = {
    ...baseMessage,
    role: MessageRole.Assistant,
    content: [{ type: "text", text: "Hi there" }],
  };

  const systemMessage: ThreadSystemMessage = {
    ...baseMessage,
    role: MessageRole.System,
    content: [{ type: "text", text: "System instructions" }],
  };

  const toolMessage: ThreadToolMessage = {
    ...baseMessage,
    role: MessageRole.Tool,
    content: [{ type: "text", text: '{"result": "success"}' }],
    tool_call_id: "tc-123",
  };

  describe("isUserMessage", () => {
    it("should return true for user messages", () => {
      expect(isUserMessage(userMessage)).toBe(true);
    });

    it("should return false for assistant messages", () => {
      expect(isUserMessage(assistantMessage)).toBe(false);
    });

    it("should return false for system messages", () => {
      expect(isUserMessage(systemMessage)).toBe(false);
    });

    it("should return false for tool messages", () => {
      expect(isUserMessage(toolMessage)).toBe(false);
    });

    it("should narrow the type correctly", () => {
      const message: ThreadMessage = userMessage;
      if (isUserMessage(message)) {
        // TypeScript should recognize this as ThreadUserMessage
        expect(message.role).toBe(MessageRole.User);
      }
    });
  });

  describe("isAssistantMessage", () => {
    it("should return true for assistant messages", () => {
      expect(isAssistantMessage(assistantMessage)).toBe(true);
    });

    it("should return false for user messages", () => {
      expect(isAssistantMessage(userMessage)).toBe(false);
    });

    it("should return false for system messages", () => {
      expect(isAssistantMessage(systemMessage)).toBe(false);
    });

    it("should return false for tool messages", () => {
      expect(isAssistantMessage(toolMessage)).toBe(false);
    });

    it("should allow access to assistant-specific fields when narrowed", () => {
      const message: ThreadMessage = {
        ...assistantMessage,
        toolCallRequest: {
          toolName: "get_weather",
          parameters: [{ parameterName: "city", parameterValue: "Seattle" }],
        },
        reasoning: ["thinking..."],
        reasoningDurationMS: 500,
      };
      if (isAssistantMessage(message)) {
        expect(message.toolCallRequest?.toolName).toBe("get_weather");
        expect(message.reasoning).toEqual(["thinking..."]);
        expect(message.reasoningDurationMS).toBe(500);
      }
    });
  });

  describe("isSystemMessage", () => {
    it("should return true for system messages", () => {
      expect(isSystemMessage(systemMessage)).toBe(true);
    });

    it("should return false for user messages", () => {
      expect(isSystemMessage(userMessage)).toBe(false);
    });

    it("should return false for assistant messages", () => {
      expect(isSystemMessage(assistantMessage)).toBe(false);
    });

    it("should return false for tool messages", () => {
      expect(isSystemMessage(toolMessage)).toBe(false);
    });
  });

  describe("isToolMessage", () => {
    it("should return true for tool messages", () => {
      expect(isToolMessage(toolMessage)).toBe(true);
    });

    it("should return false for user messages", () => {
      expect(isToolMessage(userMessage)).toBe(false);
    });

    it("should return false for assistant messages", () => {
      expect(isToolMessage(assistantMessage)).toBe(false);
    });

    it("should return false for system messages", () => {
      expect(isToolMessage(systemMessage)).toBe(false);
    });

    it("should allow access to tool_call_id when narrowed", () => {
      const message: ThreadMessage = toolMessage;
      if (isToolMessage(message)) {
        expect(message.tool_call_id).toBe("tc-123");
      }
    });
  });

  describe("type guard combinations", () => {
    it("should work correctly when iterating over mixed messages", () => {
      const messages: ThreadMessage[] = [
        userMessage,
        assistantMessage,
        systemMessage,
        toolMessage,
      ];

      const userMessages = messages.filter(isUserMessage);
      const assistantMessages = messages.filter(isAssistantMessage);
      const systemMessages = messages.filter(isSystemMessage);
      const toolMessages = messages.filter(isToolMessage);

      expect(userMessages).toHaveLength(1);
      expect(assistantMessages).toHaveLength(1);
      expect(systemMessages).toHaveLength(1);
      expect(toolMessages).toHaveLength(1);
    });
  });
});
