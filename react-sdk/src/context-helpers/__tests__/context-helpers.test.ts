import { getUserPageContext, getUserTimeContext } from "../index";

describe("Context Helpers", () => {
  describe("getUserTimeContext", () => {
    it("should return user time context with all required fields", () => {
      const context = getUserTimeContext();

      expect(context.name).toBe("userTime");
      expect(context.context).toHaveProperty("localTime");
      expect(context.context).toHaveProperty("timezone");
      expect(context.context).toHaveProperty("timestamp");
      expect(context.context).toHaveProperty("offsetMinutes");

      // Verify data types
      expect(typeof context.context.localTime).toBe("string");
      expect(typeof context.context.timezone).toBe("string");
      expect(typeof context.context.timestamp).toBe("string");
      expect(typeof context.context.offsetMinutes).toBe("number");

      // Verify timestamp is valid ISO string
      expect(() => new Date(context.context.timestamp)).not.toThrow();
    });
  });

  describe("getUserPageContext", () => {
    it("should return page context with default values in test environment", () => {
      const context = getUserPageContext();

      expect(context.name).toBe("userPage");
      expect(context.context).toHaveProperty("url");
      expect(context.context).toHaveProperty("pathname");
      expect(context.context).toHaveProperty("hostname");
      expect(context.context).toHaveProperty("search");
      expect(context.context).toHaveProperty("hash");
      expect(context.context).toHaveProperty("title");
      expect(context.context).toHaveProperty("referrer");

      // Verify data types
      expect(typeof context.context.url).toBe("string");
      expect(typeof context.context.pathname).toBe("string");
      expect(typeof context.context.hostname).toBe("string");
      expect(typeof context.context.search).toBe("string");
      expect(typeof context.context.hash).toBe("string");
      expect(typeof context.context.title).toBe("string");
      expect(typeof context.context.referrer).toBe("string");
    });
  });
});
