import type { TamboToolUseContent } from "@tambo-ai/react";
import { getToolStatusMessage } from "./get-tool-status-message";

describe("getToolStatusMessage", () => {
  it("returns null when toolCallRequest is missing", () => {
    expect(getToolStatusMessage(undefined, false)).toBeNull();
  });

  it('returns "Calling name" when loading', () => {
    const toolCallRequest: TamboToolUseContent = {
      type: "tool_use",
      id: "tc-1",
      name: "search",
      input: {},
    };
    expect(getToolStatusMessage(toolCallRequest, true)).toBe("Calling search");
  });

  it('returns "Called name" when not loading', () => {
    const toolCallRequest: TamboToolUseContent = {
      type: "tool_use",
      id: "tc-1",
      name: "search",
      input: {},
    };
    expect(getToolStatusMessage(toolCallRequest, false)).toBe("Called search");
  });

  it("treats undefined isLoading as not loading", () => {
    const toolCallRequest: TamboToolUseContent = {
      type: "tool_use",
      id: "tc-1",
      name: "search",
      input: {},
    };

    expect(getToolStatusMessage(toolCallRequest, undefined)).toBe(
      "Called search",
    );
  });

  it("returns custom statusMessage when loading", () => {
    const toolCallRequest: TamboToolUseContent = {
      type: "tool_use",
      id: "tc-1",
      name: "search",
      input: {},
      statusMessage: "Searching the web...",
    };
    expect(getToolStatusMessage(toolCallRequest, true)).toBe(
      "Searching the web...",
    );
  });

  it('falls back to "tool" when name is missing', () => {
    const toolCallRequest: TamboToolUseContent = {
      type: "tool_use",
      id: "tc-1",
      name: undefined as never,
      input: {},
    };

    expect(getToolStatusMessage(toolCallRequest, true)).toBe("Calling tool");
    expect(getToolStatusMessage(toolCallRequest, false)).toBe("Called tool");
  });
});
