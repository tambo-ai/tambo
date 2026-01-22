/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, jest } from "@jest/globals";
import {
  getImageItems,
  handlePastedImages,
  IS_PASTED_IMAGE,
  MAX_IMAGES,
  type HandlePastedImagesOptions,
} from "../../../src/registry/message-input/paste-handler";

interface MockClipboardData {
  type: string;
  file: File | null;
}

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

const createMockImageFile = (name = "test.png", type = "image/png"): File => {
  return new File(["fake-image-content"], name, { type });
};

describe("paste-handler", () => {
  describe("getImageItems", () => {
    it("returns empty imageItems when clipboardData is null", () => {
      const result = getImageItems(null);

      expect(result.imageItems).toEqual([]);
      expect(result.hasText).toBe(false);
    });

    it("returns empty imageItems when clipboardData is undefined", () => {
      const result = getImageItems(undefined);

      expect(result.imageItems).toEqual([]);
      expect(result.hasText).toBe(false);
    });

    it("extracts image files from clipboard data", () => {
      const imageFile = createMockImageFile();
      const clipboardData = createClipboardData([
        { type: "image/png", file: imageFile },
      ]);

      const result = getImageItems(clipboardData);

      expect(result.imageItems).toHaveLength(1);
      expect(result.imageItems[0]).toBe(imageFile);
      expect(result.hasText).toBe(false);
    });

    it("extracts multiple image files from clipboard data", () => {
      const imageFile1 = createMockImageFile("image1.png");
      const imageFile2 = createMockImageFile("image2.jpg", "image/jpeg");
      const clipboardData = createClipboardData([
        { type: "image/png", file: imageFile1 },
        { type: "image/jpeg", file: imageFile2 },
      ]);

      const result = getImageItems(clipboardData);

      expect(result.imageItems).toHaveLength(2);
      expect(result.imageItems[0]).toBe(imageFile1);
      expect(result.imageItems[1]).toBe(imageFile2);
    });

    it("returns hasText=true when text is present", () => {
      const clipboardData = createClipboardData(
        [{ type: "text/plain", file: null }],
        "some text",
      );

      const result = getImageItems(clipboardData);

      expect(result.imageItems).toEqual([]);
      expect(result.hasText).toBe(true);
    });

    it("returns both images and hasText=true when both are present", () => {
      const imageFile = createMockImageFile();
      const clipboardData = createClipboardData(
        [
          { type: "image/png", file: imageFile },
          { type: "text/plain", file: null },
        ],
        "some text",
      );

      const result = getImageItems(clipboardData);

      expect(result.imageItems).toHaveLength(1);
      expect(result.hasText).toBe(true);
    });

    it("ignores non-image file types", () => {
      const pdfFile = new File(["pdf-content"], "document.pdf", {
        type: "application/pdf",
      });
      const clipboardData = createClipboardData([
        { type: "application/pdf", file: pdfFile },
      ]);

      const result = getImageItems(clipboardData);

      expect(result.imageItems).toEqual([]);
    });
  });

  describe("handlePastedImages", () => {
    const createMockOptions = (
      overrides: Partial<HandlePastedImagesOptions> = {},
    ): HandlePastedImagesOptions => ({
      currentImageCount: 0,
      maxImages: MAX_IMAGES,
      setImageError: jest.fn(),
      addImage: jest
        .fn<(file: File) => Promise<void>>()
        .mockResolvedValue(undefined),
      ...overrides,
    });

    it("returns hasImages=false when no images in clipboard", async () => {
      const options = createMockOptions();
      const clipboardData = createClipboardData(
        [{ type: "text/plain", file: null }],
        "text only",
      );

      const result = await handlePastedImages(clipboardData, options);

      expect(result.hasImages).toBe(false);
      expect(result.hasText).toBe(true);
      expect(result.success).toBe(true);
      expect(options.addImage).not.toHaveBeenCalled();
    });

    it("adds images and returns success when within limit", async () => {
      const options = createMockOptions();
      const imageFile = createMockImageFile();
      const clipboardData = createClipboardData([
        { type: "image/png", file: imageFile },
      ]);

      const result = await handlePastedImages(clipboardData, options);

      expect(result.hasImages).toBe(true);
      expect(result.hasText).toBe(false);
      expect(result.success).toBe(true);
      expect(options.addImage).toHaveBeenCalledWith(imageFile);
      expect(imageFile[IS_PASTED_IMAGE]).toBe(true);
    });

    it("marks all pasted images with IS_PASTED_IMAGE symbol", async () => {
      const options = createMockOptions();
      const imageFile1 = createMockImageFile("image1.png");
      const imageFile2 = createMockImageFile("image2.png");
      const clipboardData = createClipboardData([
        { type: "image/png", file: imageFile1 },
        { type: "image/png", file: imageFile2 },
      ]);

      await handlePastedImages(clipboardData, options);

      expect(imageFile1[IS_PASTED_IMAGE]).toBe(true);
      expect(imageFile2[IS_PASTED_IMAGE]).toBe(true);
    });

    it("sets error and returns failure when exceeding max images", async () => {
      const setImageError = jest.fn();
      const options = createMockOptions({
        currentImageCount: 9,
        maxImages: 10,
        setImageError,
      });
      const imageFile1 = createMockImageFile("image1.png");
      const imageFile2 = createMockImageFile("image2.png");
      const clipboardData = createClipboardData([
        { type: "image/png", file: imageFile1 },
        { type: "image/png", file: imageFile2 },
      ]);

      const result = await handlePastedImages(clipboardData, options);

      expect(result.hasImages).toBe(true);
      expect(result.success).toBe(false);
      expect(setImageError).toHaveBeenCalledWith("Max 10 uploads at a time");
      expect(options.addImage).not.toHaveBeenCalled();
    });

    it("clears error before adding images", async () => {
      const setImageError = jest.fn();
      const options = createMockOptions({ setImageError });
      const imageFile = createMockImageFile();
      const clipboardData = createClipboardData([
        { type: "image/png", file: imageFile },
      ]);

      await handlePastedImages(clipboardData, options);

      expect(setImageError).toHaveBeenCalledWith(null);
    });

    it("continues processing on individual image failure", async () => {
      const addImage = jest
        .fn<(file: File) => Promise<void>>()
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce(undefined);
      const options = createMockOptions({ addImage });
      const imageFile1 = createMockImageFile("image1.png");
      const imageFile2 = createMockImageFile("image2.png");
      const clipboardData = createClipboardData([
        { type: "image/png", file: imageFile1 },
        { type: "image/png", file: imageFile2 },
      ]);

      const result = await handlePastedImages(clipboardData, options);

      expect(result.success).toBe(false);
      expect(addImage).toHaveBeenCalledTimes(2);
    });

    it("returns hasText=true when paste contains both images and text", async () => {
      const options = createMockOptions();
      const imageFile = createMockImageFile();
      const clipboardData = createClipboardData(
        [
          { type: "image/png", file: imageFile },
          { type: "text/plain", file: null },
        ],
        "some text",
      );

      const result = await handlePastedImages(clipboardData, options);

      expect(result.hasImages).toBe(true);
      expect(result.hasText).toBe(true);
      expect(result.success).toBe(true);
    });
  });

  describe("MAX_IMAGES constant", () => {
    it("is set to 10", () => {
      expect(MAX_IMAGES).toBe(10);
    });
  });

  describe("IS_PASTED_IMAGE symbol", () => {
    it("is a unique symbol", () => {
      expect(typeof IS_PASTED_IMAGE).toBe("symbol");
      expect(IS_PASTED_IMAGE.description).toBe("tambo-is-pasted-image");
    });

    it("can be used to mark files", () => {
      const file = createMockImageFile();
      file[IS_PASTED_IMAGE] = true;

      expect(file[IS_PASTED_IMAGE]).toBe(true);
    });
  });
});
