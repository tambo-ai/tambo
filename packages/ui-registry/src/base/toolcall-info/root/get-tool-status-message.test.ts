import { TamboThreadMessage } from "@tambo-ai/react";
import { getToolStatusMessage } from "./get-tool-status-message";
import { createToolCallMessage } from "./toolcall-info.test";

describe("getToolStatusMessage", () => {
  it("returns null for user messages", () => {
    const message = createToolCallMessage({
      role: "user",
      toolCallRequest: { toolName: "test", parameters: [] },
    });
    expect(getToolStatusMessage(message, false)).toBeNull();
  });

  it("returns null when no tool call request exists", () => {
    const message = createToolCallMessage({
      role: "assistant",
      toolCallRequest: undefined,
    });
    expect(getToolStatusMessage(message, false)).toBeNull();
  });

  it('returns "Calling toolName" when loading', () => {
    const message = createToolCallMessage({
      role: "assistant",
      toolCallRequest: { toolName: "search", parameters: [] },
    });
    expect(getToolStatusMessage(message, true)).toBe("Calling search");
  });

  it('returns "Called toolName" when not loading', () => {
    const message = createToolCallMessage({
      role: "assistant",
      toolCallRequest: { toolName: "search", parameters: [] },
    });
    expect(getToolStatusMessage(message, false)).toBe("Called search");
  });

  it("returns custom statusMessage when loading", () => {
    const message = createToolCallMessage({
      role: "assistant",
      toolCallRequest: { toolName: "search", parameters: [] },
      component: {
        statusMessage: "Searching the web...",
      } as TamboThreadMessage["component"],
    });
    expect(getToolStatusMessage(message, true)).toBe("Searching the web...");
  });

  it("returns custom completionStatusMessage when not loading", () => {
    const message = createToolCallMessage({
      role: "assistant",
      toolCallRequest: { toolName: "search", parameters: [] },
      component: {
        completionStatusMessage: "Search complete",
      } as TamboThreadMessage["component"],
    });
    expect(getToolStatusMessage(message, false)).toBe("Search complete");
  });

  it('falls back to "tool" when toolName is missing', () => {
    const message = createToolCallMessage({
      role: "assistant",
      toolCallRequest: {
        // toolName is intentionally missing
        parameters: [],
      } as unknown as TamboThreadMessage["toolCallRequest"],
    });
    expect(getToolStatusMessage(message, true)).toBe("Calling tool");
    expect(getToolStatusMessage(message, false)).toBe("Called tool");
  });
});
