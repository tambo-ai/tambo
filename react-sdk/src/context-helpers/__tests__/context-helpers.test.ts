import { getUserPageContext, getUserTimeContext } from "../index";

describe("Context Helpers", () => {
  describe("getUserTimeContext", () => {
    it("should return user time context with all required fields", () => {
      const context = getUserTimeContext();

      expect(context.name).toBe("userTime");
      expect(context.context).toHaveProperty("timestamp");

      // Verify data types
      expect(typeof context.context.timestamp).toBe("string");

      // Verify timestamp is valid ISO string
      expect(() => new Date(context.context.timestamp)).not.toThrow();
    });
  });

  describe("getUserPageContext", () => {
    it("should return page context with default values in test environment", () => {
      const context = getUserPageContext();

      expect(context.name).toBe("userPage");
      expect(context.context).toHaveProperty("url");
      expect(context.context).toHaveProperty("title");

      // Verify data types
      expect(typeof context.context.url).toBe("string");
      expect(typeof context.context.title).toBe("string");
    });
  });
});
