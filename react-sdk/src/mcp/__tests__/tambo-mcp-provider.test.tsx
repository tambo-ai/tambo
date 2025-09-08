import { extractErrorMessage } from "../tambo-mcp-provider";

// Mock the MCP client to avoid ES module issues
jest.mock("../mcp-client", () => ({
  MCPClient: jest.fn(),
  MCPTransport: {
    SSE: "sse",
    HTTP: "http",
  },
}));

// Mock the registry provider to avoid dependency issues
jest.mock("../../providers/tambo-registry-provider", () => ({
  useTamboRegistry: jest.fn(),
}));

describe("extractErrorMessage", () => {
  describe("Array content handling", () => {
    it("should extract text from array content with multiple text items", () => {
      const content = [
        { type: "text", text: "Error:" },
        { type: "text", text: "Tool execution failed" },
        { type: "image", url: "http://example.com/error.png" }, // Should be filtered out
      ];

      const result = extractErrorMessage(content);

      expect(result).toBe("Error: Tool execution failed");
    });

    it("should extract text from array content with single text item", () => {
      const content = [{ type: "text", text: "Simple error message" }];

      const result = extractErrorMessage(content);

      expect(result).toBe("Simple error message");
    });

    it("should return empty string for array content with no text items", () => {
      const content = [
        { type: "image", url: "http://example.com/error.png" },
        { type: "resource", uri: "file://error.log" },
      ];

      const result = extractErrorMessage(content);

      expect(result).toBe("");
    });

    it("should return empty string for empty array content", () => {
      const content: any[] = [];

      const result = extractErrorMessage(content);

      expect(result).toBe("");
    });

    it("should handle array content with mixed types correctly", () => {
      const content = [
        { type: "resource", uri: "file://log.txt" },
        { type: "text", text: "First error" },
        { type: "image", url: "http://example.com/img.png" },
        { type: "text", text: "Second error" },
        { type: "unknown", data: "something" },
      ];

      const result = extractErrorMessage(content);

      expect(result).toBe("First error Second error");
    });
  });

  describe("Non-array content handling", () => {
    it("should return string content as-is", () => {
      const content = "Direct error message";

      const result = extractErrorMessage(content);

      expect(result).toBe("Direct error message");
    });

    it("should handle null content", () => {
      const content = null;

      const result = extractErrorMessage(content);

      expect(result).toBe(null);
    });

    it("should handle undefined content", () => {
      const content = undefined;

      const result = extractErrorMessage(content);

      expect(result).toBe(undefined);
    });

    it("should handle number content", () => {
      const content = 42;

      const result = extractErrorMessage(content);

      expect(result).toBe(42);
    });

    it("should handle boolean content", () => {
      const content = false;

      const result = extractErrorMessage(content);

      expect(result).toBe(false);
    });

    it("should handle object content", () => {
      const content = { error: "Something went wrong" };

      const result = extractErrorMessage(content);

      expect(result).toEqual({ error: "Something went wrong" });
    });
  });
});
