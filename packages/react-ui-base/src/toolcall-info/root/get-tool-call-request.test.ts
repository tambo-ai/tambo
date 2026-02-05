import { TamboThreadMessage } from "@tambo-ai/react";
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
  } as TamboThreadMessage;
}

describe("getToolCallRequest", () => {
  it("returns toolCallRequest from message", () => {
    const toolCallRequest = { toolName: "test_tool", parameters: [] };
    const message = createMessage({ toolCallRequest });
    expect(getToolCallRequest(message)).toBe(toolCallRequest);
  });

  it("returns component toolCallRequest when message has none", () => {
    const toolCallRequest = { toolName: "component_tool", parameters: [] };
    const message = createMessage({
      component: {
        toolCallRequest,
        message: "",
        componentName: "TestComponent",
        componentState: {},
        props: {},
      } as TamboThreadMessage["component"],
    });
    expect(getToolCallRequest(message)).toBe(toolCallRequest);
  });

  it("prefers message toolCallRequest over component toolCallRequest", () => {
    const messageToolCall = { toolName: "message_tool", parameters: [] };
    const componentToolCall = { toolName: "component_tool", parameters: [] };
    const message = createMessage({
      toolCallRequest: messageToolCall,
      component: {
        toolCallRequest: componentToolCall,
        componentName: "TestComponent",
        message: "",
        componentState: {},
        props: {},
      } as TamboThreadMessage["component"],
    });
    expect(getToolCallRequest(message)).toBe(messageToolCall);
  });

  it("returns undefined when no toolCallRequest exists", () => {
    const message = createMessage();
    expect(getToolCallRequest(message)).toBeUndefined();
  });
});
