import { currentPageContextHelper, currentTimeContextHelper } from "../index";

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

      // Shape: { timestamp: string }
      expect(context).toHaveProperty("timestamp");
      expect(typeof context!.timestamp).toBe("string");

      // Verify timestamp string parses
      expect(() => new Date(context!.timestamp as string)).not.toThrow();
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

      // Shape: { url: string, title: string }
      expect(context).toHaveProperty("url");
      expect(context).toHaveProperty("title");

      expect(typeof context.url).toBe("string");
      expect(typeof context.title).toBe("string");
    });
  });
});
