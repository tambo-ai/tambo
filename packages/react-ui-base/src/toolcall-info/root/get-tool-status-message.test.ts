import { getToolStatusMessage } from "./get-tool-status-message";
import { createToolCallMessage } from "./toolcall-info.test";

describe("getToolStatusMessage", () => {
  it("returns null for user messages", () => {
    const message = createToolCallMessage({
      role: "user",
    });
    expect(getToolStatusMessage(message, false)).toBeNull();
  });

  it("returns null when no tool call content exists", () => {
    const message = createToolCallMessage({
      content: [{ type: "text", text: "hello" }],
    });
    expect(getToolStatusMessage(message, false)).toBeNull();
  });

  it('returns "Calling name" when loading', () => {
    const message = createToolCallMessage({
      toolUse: { name: "search" },
    });
    expect(getToolStatusMessage(message, true)).toBe("Calling search");
  });

  it('returns "Called name" when not loading', () => {
    const message = createToolCallMessage({
      toolUse: { name: "search" },
    });
    expect(getToolStatusMessage(message, false)).toBe("Called search");
  });

  it("returns custom statusMessage when loading", () => {
    const message = createToolCallMessage({
      toolUse: { name: "search", statusMessage: "Searching the web..." },
    });
    expect(getToolStatusMessage(message, true)).toBe("Searching the web...");
  });

  it('falls back to "tool" when name is missing', () => {
    const message = createToolCallMessage({
      content: [
        { type: "tool_use", id: "tc-1", name: undefined as never, input: {} },
      ],
    });
    expect(getToolStatusMessage(message, true)).toBe("Calling tool");
    expect(getToolStatusMessage(message, false)).toBe("Called tool");
  });
});
