import { describe, expect, it, jest } from "@jest/globals";

await jest.unstable_mockModule("@tambo-ai/react/mcp", () => ({
  useTamboMcpPrompt: jest.fn(() => ({ data: null })),
  useTamboMcpPromptList: jest.fn(() => ({ data: [], isLoading: false })),
  useTamboMcpResourceList: jest.fn(() => ({ data: [], isLoading: false })),
  useTamboElicitationContext: jest.fn(() => ({
    elicitation: null,
    resolveElicitation: null,
  })),
}));

const { MessageThreadPanel } = await import("./message-thread-panel");

describe("MessageThreadPanel", () => {
  it("exports a component", () => {
    expect(MessageThreadPanel).toBeDefined();
  });
});
