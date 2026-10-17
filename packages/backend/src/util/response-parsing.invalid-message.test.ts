import { extractMessageContent } from "./response-parsing";

describe("extractMessageContent with malformed message fields", () => {
  it("never returns a non-string message payload", () => {
    for (const message of [null, 0, false, { nested: "message" }]) {
      const input = JSON.stringify({ message });
      expect(extractMessageContent(input, false)).toBe(input);
    }
  });

  it("still extracts actual string messages", () => {
    expect(extractMessageContent('{"message":"hello"}', false)).toBe("hello");
    expect(extractMessageContent('{"message":""}', false)).toBe("");
  });
});
