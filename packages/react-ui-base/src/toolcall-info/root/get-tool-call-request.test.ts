import type { TamboThreadMessage, TamboToolUseContent } from "@tambo-ai/react";
import { getToolCallRequest } from "./get-tool-call-request";

function createMessage(
  overrides: Partial<TamboThreadMessage> = {},
): TamboThreadMessage {
  return {
    id: "test-id",
    role: "assistant",
    content: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("getToolCallRequest", () => {
  it("returns tool_use content block from message", () => {
    const toolUseBlock: TamboToolUseContent = {
      type: "tool_use",
      id: "tool-1",
      name: "test_tool",
      input: { param: "value" },
    };
    const message = createMessage({ content: [toolUseBlock] });
    expect(getToolCallRequest(message)).toBe(toolUseBlock);
  });

  it("returns first tool_use block when multiple exist", () => {
    const firstBlock: TamboToolUseContent = {
      type: "tool_use",
      id: "tool-1",
      name: "first_tool",
      input: {},
    };
    const secondBlock: TamboToolUseContent = {
      type: "tool_use",
      id: "tool-2",
      name: "second_tool",
      input: {},
    };
    const message = createMessage({ content: [firstBlock, secondBlock] });
    expect(getToolCallRequest(message)).toBe(firstBlock);
  });

  it("returns undefined when no tool_use content exists", () => {
    const message = createMessage({
      content: [{ type: "text", text: "hello" }],
    });
    expect(getToolCallRequest(message)).toBeUndefined();
  });

  it("returns undefined for empty content", () => {
    const message = createMessage();
    expect(getToolCallRequest(message)).toBeUndefined();
  });
});
