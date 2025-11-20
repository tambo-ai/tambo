import { describe, expect, it } from "@jest/globals";
import { maskEmail } from "./email";

describe("maskEmail", () => {
  it("masks a typical email, keeping first char and domain", () => {
    expect(maskEmail("alice@example.com")).toBe("a***@example.com");
  });

  it("masks complex local parts and preserves domain", () => {
    expect(maskEmail("A.LONG-NAME+tag@sub.example.co.uk")).toBe(
      "A***@sub.example.co.uk",
    );
  });

  it("trims whitespace before masking", () => {
    expect(maskEmail("  a@b.com ")).toBe("a***@b.com");
  });

  it("handles non-email strings by masking after the first character", () => {
    expect(maskEmail("nonsense")).toBe("n***");
    expect(maskEmail("")).toBe("***");
  });
});
