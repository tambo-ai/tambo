import { extractMessageContent } from "./response-parsing";

describe("extractMessageContent", () => {
  it("should return empty string when content is null", () => {
    expect(extractMessageContent(null)).toBe("");
  });

  it("should return plain string content", () => {
    const content = "Hello world";
    expect(extractMessageContent(content)).toBe(content);
  });

  it("should extract message from JSON object with message field", () => {
    const content = JSON.stringify({ message: "Hello JSON" });
    const logSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(extractMessageContent(content)).toBe("Hello JSON");
    expect(logSpy).toHaveBeenCalledWith(
      "noComponentResponse message is a json object, extracting message",
    );

    logSpy.mockRestore();
  });

  it("should handle partial JSON parsing edge cases", () => {
    // partial-json allows parsing truncated JSON strings
    // e.g. '{"message": "He' -> { message: "He" }
    const content = '{"message": "Hello Partial"';
    const logSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(extractMessageContent(content)).toBe("Hello Partial");

    logSpy.mockRestore();
  });
});
