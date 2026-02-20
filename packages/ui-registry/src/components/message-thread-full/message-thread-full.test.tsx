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

const { MessageThreadFull } = await import("./message-thread-full");

describe("MessageThreadFull", () => {
  it("exports a component", () => {
    expect(MessageThreadFull).toBeDefined();
  });
});
