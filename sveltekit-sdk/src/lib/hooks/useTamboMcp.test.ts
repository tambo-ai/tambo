/**
 * Tests for MCP hooks.
 *
 * Note: Testing Svelte getContext requires running in a component context.
 * These tests verify the hook behavior when context is missing (error cases).
 * Full integration tests would require @testing-library/svelte with component wrappers.
 */
import { describe, it, expect, vi } from "vitest";

// Mock svelte's getContext to return undefined (simulating no provider)
vi.mock("svelte", async () => {
  const actual = await vi.importActual("svelte");
  return {
    ...actual,
    getContext: vi.fn(() => undefined),
  };
});

describe("MCP Hooks - Error Cases", () => {
  describe("useTamboMcpServers", () => {
    it("should throw when used outside TamboProvider", async () => {
      // Import after mock is set up
      const { useTamboMcpServers } = await import("./useTamboMcp.js");

      expect(() => useTamboMcpServers()).toThrow(
        "useTamboMcpServers must be used within a TamboProvider",
      );
    });
  });

  describe("useTamboMcpPrompt", () => {
    it("should throw when used outside TamboProvider", async () => {
      const { useTamboMcpPrompt } = await import("./useTamboMcp.js");

      await expect(useTamboMcpPrompt("server", "prompt")).rejects.toThrow(
        "useTamboMcpPrompt must be used within a TamboProvider",
      );
    });
  });

  describe("useTamboMcpResource", () => {
    it("should throw when used outside TamboProvider", async () => {
      const { useTamboMcpResource } = await import("./useTamboMcp.js");

      await expect(useTamboMcpResource("server", "uri")).rejects.toThrow(
        "useTamboMcpResource must be used within a TamboProvider",
      );
    });
  });
});

describe("MCP Hooks - With Context", () => {
  it("should return context when available", async () => {
    // Reset the mock to return a context
    const mockContext = {
      servers: [],
      tools: [],
      resources: [],
      prompts: [],
      isConnecting: false,
      callTool: vi.fn(),
      getResource: vi.fn().mockResolvedValue({ data: "test" }),
      getPrompt: vi.fn().mockResolvedValue({ message: "test" }),
    };

    vi.doMock("svelte", async () => {
      const actual = await vi.importActual("svelte");
      return {
        ...actual,
        getContext: vi.fn(() => mockContext),
      };
    });

    // Re-import with new mock
    vi.resetModules();
    const { useTamboMcpServers } = await import("./useTamboMcp.js");

    const context = useTamboMcpServers();

    expect(context).toBe(mockContext);
    expect(context.servers).toEqual([]);
    expect(context.isConnecting).toBe(false);
  });
});
