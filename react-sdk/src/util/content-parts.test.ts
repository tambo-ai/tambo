import { isContentPartArray, isContentPart, toText } from "./content-parts";

describe("content-parts type guards", () => {
  it("returns true for a valid text content part array", () => {
    const parts = [{ type: "text", text: "hello" }];
    expect(isContentPartArray(parts)).toBe(true);
  });

  it("returns true for a valid image_url content part array", () => {
    const parts = [
      { type: "image_url", image_url: { url: "data:image/png;base64,abc" } },
    ];
    expect(isContentPartArray(parts)).toBe(true);
  });

  it("returns false for non-object array elements", () => {
    const parts = ["text", 123, null];
    expect(isContentPartArray(parts as any)).toBe(false);
  });

  it("returns false when elements are objects without string type", () => {
    const parts = [{}, { type: 42 }, { type: undefined }];
    expect(isContentPartArray(parts as any)).toBe(false);
  });

  it("isContentPart narrows a single part", () => {
    const val: unknown = { type: "text", text: "hi" };
    if (!isContentPart(val)) {
      throw new Error("should be content part");
    }
    // runtime spot-check
    expect(val.type).toBe("text");
  });

  it("returns false for non-array inputs", () => {
    expect(isContentPartArray({})).toBe(false);
    expect(isContentPartArray(null)).toBe(false);
    expect(isContentPartArray(undefined)).toBe(false);
    expect(isContentPartArray("foo")).toBe(false);
  });

  it("toText safely stringifies values and never throws", () => {
    expect(toText("hello")).toBe("hello");
    expect(toText(42)).toBe("42");
    const circular: any = { a: 1 };
    circular.self = circular;
    // Should not throw for circular structures
    expect(() => toText(circular)).not.toThrow();
    expect(typeof toText(undefined)).toBe("string");
  });
});
