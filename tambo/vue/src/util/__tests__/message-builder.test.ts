import { buildMessageContent, StagedImage } from "../../util/message-builder";

describe("buildMessageContent (vue)", () => {
  const createMockStagedImage = (
    overrides: Partial<StagedImage> = {},
  ): StagedImage => ({
    dataUrl: "data:image/png;base64,mock-data",
    ...overrides,
  } as any);

  it("text only", () => {
    expect(buildMessageContent("Hello world", [])).toEqual([
      { type: "text", text: "Hello world" },
    ]);
  });

  it("images only", () => {
    const image = createMockStagedImage({ dataUrl: "data:image/png;base64,abc" });
    expect(buildMessageContent("", [image])).toEqual([
      { type: "image_url", image_url: { url: "data:image/png;base64,abc" } },
    ]);
  });

  it("both", () => {
    const images = [
      createMockStagedImage({ dataUrl: "data:image/png;base64,one" }),
      createMockStagedImage({ dataUrl: "data:image/jpeg;base64,two" }),
    ];
    expect(buildMessageContent("Check:", images)).toEqual([
      { type: "text", text: "Check:" },
      { type: "image_url", image_url: { url: "data:image/png;base64,one" } },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,two" } },
    ]);
  });

  it("throws on empty", () => {
    expect(() => buildMessageContent("", [])).toThrow(
      "Message must contain text or images",
    );
  });
});

