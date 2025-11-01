import {
  getSafeContent,
  checkHasContent,
  getMessageImages,
  getMessageAttachments,
} from "../message-content";

describe("getSafeContent", () => {
  it("returns empty string for null/undefined", () => {
    expect(getSafeContent(null)).toBe("");
    expect(getSafeContent(undefined)).toBe("");
  });

  it("returns string content as-is", () => {
    expect(getSafeContent("Hello")).toBe("Hello");
  });

  it("joins text array items", () => {
    expect(
      getSafeContent([
        { type: "text", text: "Hello " },
        { type: "text", text: "World" },
      ]),
    ).toBe("Hello World");
  });

  it("filters out non-text items", () => {
    expect(
      getSafeContent([
        { type: "text", text: "Hello" },
        { type: "image_url", image_url: { url: "test.png" } },
        { type: "text", text: " World" },
      ]),
    ).toBe("Hello World");
  });
});

describe("checkHasContent", () => {
  it("returns false for empty content", () => {
    expect(checkHasContent(null)).toBe(false);
    expect(checkHasContent("")).toBe(false);
    expect(checkHasContent("   ")).toBe(false);
    expect(checkHasContent([])).toBe(false);
  });

  it("returns true for valid text", () => {
    expect(checkHasContent("Hello")).toBe(true);
    expect(checkHasContent([{ type: "text", text: "Hello" }])).toBe(true);
  });

  it("returns true for images", () => {
    expect(
      checkHasContent([{ type: "image_url", image_url: { url: "test.png" } }]),
    ).toBe(true);
  });
});

describe("getMessageImages", () => {
  it("extracts image URLs", () => {
    const images = getMessageImages([
      { type: "image_url", image_url: { url: "image1.png" } },
      { type: "image_url", image_url: { url: "image2.png" } },
    ]);
    expect(images).toEqual(["image1.png", "image2.png"]);
  });

  it("returns empty array for no images", () => {
    expect(getMessageImages(null)).toEqual([]);
    expect(getMessageImages([])).toEqual([]);
    expect(getMessageImages([{ type: "image_url" }])).toEqual([]);
  });
});

describe("getMessageAttachments", () => {
  it("returns structured attachments for known types", () => {
    const attachments = getMessageAttachments([
      {
        type: "image_url",
        image_url: { url: "image.png", mime_type: "image/png" },
      },
      { type: "text", text: "Hello" },
      { type: "unknown_type", foo: "bar" } as any,
    ]);

    expect(attachments).toHaveLength(2);
    expect(attachments[0]).toMatchObject({
      kind: "image",
      type: "image_url",
      url: "image.png",
      mimeType: "image/png",
    });
    expect(attachments[1]).toMatchObject({
      kind: "other",
      type: "unknown_type",
    });
  });

  it("returns empty array for invalid content", () => {
    expect(getMessageAttachments(null)).toEqual([]);
    expect(getMessageAttachments(undefined)).toEqual([]);
    expect(getMessageAttachments([])).toEqual([]);
  });
});
