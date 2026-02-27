import { validateInput } from "./validate-input";

describe("validateInput", () => {
  it("returns valid for normal input", () => {
    const result = validateInput("Hello world");
    expect(result.isValid).toBe(true);
    expect(result.sanitizedInput).toBe("Hello world");
    expect(result.error).toBeUndefined();
  });

  it("trims whitespace", () => {
    const result = validateInput("  hello  ");
    expect(result.isValid).toBe(true);
    expect(result.sanitizedInput).toBe("hello");
  });

  it("rejects empty string", () => {
    const result = validateInput("");
    expect(result.isValid).toBe(false);
    expect(result.error?.message).toBe("Message cannot be empty");
  });

  it("rejects whitespace-only string", () => {
    const result = validateInput("   ");
    expect(result.isValid).toBe(false);
    expect(result.error?.message).toBe("Message cannot be empty");
  });

  it("rejects messages over 10000 characters", () => {
    const long = "a".repeat(10001);
    const result = validateInput(long);
    expect(result.isValid).toBe(false);
    expect(result.error?.message).toBe(
      "Message is too long (max 10000 characters)",
    );
  });

  it("accepts messages at exactly 10000 characters", () => {
    const exact = "a".repeat(10000);
    const result = validateInput(exact);
    expect(result.isValid).toBe(true);
  });
});
