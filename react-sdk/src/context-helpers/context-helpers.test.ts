import { currentPageContextHelper, currentTimeContextHelper } from "./index";

/**
 * Tests for prebuilt context helper functions.
 *
 * These helpers now return raw values (or null) instead of { name, context }.
 * The provider is responsible for wrapping values as { name, context }.
 */
describe("Context Helpers (prebuilt functions)", () => {
  describe("currentTimeContextHelper", () => {
    it("should return user time context with required fields", () => {
      const context = currentTimeContextHelper();

      // Should not be null (error case)
      expect(context).not.toBeNull();

      // Type guard: ensure context is an object
      expect(typeof context).toBe("object");
      if (typeof context !== "object" || context === null) {
        throw new Error("Expected context to be a non-null object");
      }

      // Shape: { timestamp: string }
      expect(context).toHaveProperty("timestamp");
      const contextObj = context as Record<string, unknown>;
      expect(typeof contextObj.timestamp).toBe("string");

      // Verify timestamp string parses
      expect(() => new Date(contextObj.timestamp as string)).not.toThrow();
    });
  });

  describe("currentPageContextHelper", () => {
    it("should return page context in browser, or null otherwise", () => {
      const context = currentPageContextHelper();

      if (context === null) {
        // Non-browser environments should return null to skip
        expect(context).toBeNull();
        return;
      }

      // Type guard: ensure context is an object
      expect(typeof context).toBe("object");
      if (typeof context !== "object") {
        throw new Error("Expected context to be an object");
      }

      // Shape: { url: string, title: string }
      expect(context).toHaveProperty("url");
      expect(context).toHaveProperty("title");

      const contextObj = context as Record<string, unknown>;
      expect(typeof contextObj.url).toBe("string");
      expect(typeof contextObj.title).toBe("string");
    });
  });
});
