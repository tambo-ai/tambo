/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it } from "@jest/globals";
import { getImageItems } from "./text-editor";

interface MockClipboardData {
  type: string;
  file: File | null;
}

describe("getImageItems", () => {
  // mock clipboard data
  const createClipboardData = (
    items: MockClipboardData[],
    text: string = "",
  ): DataTransfer => {
    return {
      items: items.map((item) => ({
        type: item.type,
        getAsFile: () => item.file,
      })),
      getData: (format: string) => {
        if (format === "text/plain") {
          return text;
        }
        return "";
      },
    } as unknown as DataTransfer;
  };

  it("returns empty array when clipboardData is null", () => {
    const result = getImageItems(null);
    expect(result.imageItems).toEqual([]);
    expect(result.hasText).toBe(false);
  });

  it("extracts image files from clipboard", () => {
    const imageFile = new File([""], "image.png", { type: "image/png" });
    const clipboardData = createClipboardData([
      { type: "image/png", file: imageFile },
    ]);
    const result = getImageItems(clipboardData);
    expect(result.imageItems).toHaveLength(1);
    expect(result.imageItems[0]).toBe(imageFile);
    expect(result.hasText).toBe(false);
  });

  it("detects text in the clipboard", () => {
    const clipboardData = createClipboardData(
      [{ type: "text/plain", file: null }],
      "text",
    );
    const result = getImageItems(clipboardData);
    expect(result.imageItems).toEqual([]);
    expect(result.hasText).toBe(true);
  });

  it("extracts images and text when clipboard has both", () => {
    const imageFile = new File([""], "image.png", { type: "image/png" });
    const clipboardData = createClipboardData(
      [
        { type: "image/png", file: imageFile },
        { type: "text/plain", file: null },
      ],
      "text",
    );
    const result = getImageItems(clipboardData);
    expect(result.imageItems).toHaveLength(1);
    expect(result.imageItems[0]).toBe(imageFile);
    expect(result.hasText).toBe(true);
  });
});
