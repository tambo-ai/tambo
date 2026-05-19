import {
  ContentPartType,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { limitTokens } from "./token-limiter";

function makeMessage(
  role: MessageRole,
  text: string,
  overrides: Partial<ThreadMessage> = {},
): ThreadMessage {
  return {
    id: `msg_${Math.random().toString(36).slice(2, 8)}`,
    threadId: "thread_1",
    role,
    content: [{ type: ContentPartType.Text, text }],
    createdAt: new Date(),
    componentState: {},
    ...overrides,
  } as ThreadMessage;
}

describe("limitTokens", () => {
  it("should return all messages when under token limit", () => {
    const messages = [
      makeMessage(MessageRole.User, "Hello"),
      makeMessage(MessageRole.Assistant, "Hi there"),
    ];

    const result = limitTokens(messages, 100000);
    expect(result).toHaveLength(2);
  });

  it("should drop leading Tool messages after truncation (orphaned tool_result)", () => {
    // Build a scenario where truncation keeps: [tool, assistant, user]
    // The tool message has no preceding assistant with the tool call,
    // so it should be dropped.
    const messages: ThreadMessage[] = [
      makeMessage(MessageRole.System, "System prompt"),
      makeMessage(MessageRole.User, "First question " + "x".repeat(5000)),
      makeMessage(
        MessageRole.Assistant,
        "Tool call response " + "x".repeat(5000),
        {
          tool_call_id: "call_1",
          toolCallRequest: {
            toolName: "test_tool",
            parameters: [],
          },
        },
      ),
      makeMessage(MessageRole.Tool, "Tool result", {
        tool_call_id: "call_1",
      }),
      makeMessage(MessageRole.Assistant, "Final response"),
      makeMessage(MessageRole.User, "Follow-up"),
    ];

    // Use a very small limit to force truncation that keeps only the last few
    const result = limitTokens(messages, 50);

    // The result should not start with a Tool message (after the system message)
    const nonSystem = result.filter((m) => m.role !== MessageRole.System);
    if (nonSystem.length > 0) {
      expect(nonSystem[0].role).not.toBe(MessageRole.Tool);
    }
  });
});
