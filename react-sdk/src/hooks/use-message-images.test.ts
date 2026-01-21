import { act, renderHook } from "@testing-library/react";
import { useMessageImages } from "./use-message-images";

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: jest.fn(() => "mock-uuid-" + Math.random()),
} as any;

// Track FileReader instances for error simulation
let fileReaderInstances: {
  readAsDataURL: jest.Mock;
  onload: ((e: unknown) => void) | null;
  onerror: ((e: unknown) => void) | null;
  result: string;
}[] = [];

// Default FileReader mock that succeeds
const createSuccessfulFileReader = () => {
  const reader = {
    readAsDataURL: jest.fn(),
    onload: null as ((e: any) => void) | null,
    onerror: null as ((e: any) => void) | null,
    result: "data:image/png;base64,mock-data",
  };
  reader.readAsDataURL = jest.fn(() => {
    setTimeout(() => {
      if (reader.onload) {
        reader.onload({} as any);
      }
    }, 0);
  });
  fileReaderInstances.push(reader);
  return reader;
};

// FileReader mock that fails
const createFailingFileReader = () => {
  const reader = {
    readAsDataURL: jest.fn(),
    onload: null as ((e: any) => void) | null,
    onerror: null as ((e: any) => void) | null,
    result: "",
  };
  reader.readAsDataURL = jest.fn(() => {
    setTimeout(() => {
      if (reader.onerror) {
        reader.onerror(new Error("Failed to read file"));
      }
    }, 0);
  });
  fileReaderInstances.push(reader);
  return reader;
};

// Default to successful FileReader
(global as any).FileReader = jest.fn(() => createSuccessfulFileReader());

describe("useMessageImages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fileReaderInstances = [];
    // Reset to default successful FileReader
    (global as any).FileReader = jest.fn(() => createSuccessfulFileReader());
  });

  describe("Initialization", () => {
    it("should initialize with empty images array", () => {
      const { result } = renderHook(() => useMessageImages());
      expect(result.current.images).toEqual([]);
    });

    it("should expose all management functions", () => {
      const { result } = renderHook(() => useMessageImages());

      expect(typeof result.current.addImage).toBe("function");
      expect(typeof result.current.addImages).toBe("function");
      expect(typeof result.current.removeImage).toBe("function");
      expect(typeof result.current.clearImages).toBe("function");
    });
  });

  describe("addImage", () => {
    it("should add a valid image file", async () => {
      const { result } = renderHook(() => useMessageImages());
      const mockFile = new File(["image data"], "photo.png", {
        type: "image/png",
      });

      await act(async () => {
        await result.current.addImage(mockFile);
      });

      expect(result.current.images).toHaveLength(1);
      expect(result.current.images[0].name).toBe("photo.png");
      expect(result.current.images[0].type).toBe("image/png");
      expect(result.current.images[0].dataUrl).toBe(
        "data:image/png;base64,mock-data",
      );
    });

    it("should reject non-image files", async () => {
      const { result } = renderHook(() => useMessageImages());
      const mockFile = new File(["test"], "test-document.pdf", {
        type: "application/pdf",
      });

      await expect(result.current.addImage(mockFile)).rejects.toThrow(
        "Only image files are allowed",
      );
    });

    it("should reject when FileReader fails", async () => {
      // Use failing FileReader
      (global as any).FileReader = jest.fn(() => createFailingFileReader());

      const { result } = renderHook(() => useMessageImages());
      const mockFile = new File(["image data"], "photo.png", {
        type: "image/png",
      });

      await expect(result.current.addImage(mockFile)).rejects.toThrow();
    });
  });

  describe("addImages (batch)", () => {
    it("should add multiple valid images at once", async () => {
      const { result } = renderHook(() => useMessageImages());
      const mockFiles = [
        new File(["image1"], "photo1.png", { type: "image/png" }),
        new File(["image2"], "photo2.jpg", { type: "image/jpeg" }),
        new File(["image3"], "photo3.gif", { type: "image/gif" }),
      ];

      await act(async () => {
        await result.current.addImages(mockFiles);
      });

      expect(result.current.images).toHaveLength(3);
      expect(result.current.images[0].name).toBe("photo1.png");
      expect(result.current.images[1].name).toBe("photo2.jpg");
      expect(result.current.images[2].name).toBe("photo3.gif");
    });

    it("should filter non-images from batch and add valid ones", async () => {
      const { result } = renderHook(() => useMessageImages());
      const mockFiles = [
        new File(["image"], "photo.png", { type: "image/png" }),
        new File(["pdf"], "document.pdf", { type: "application/pdf" }),
        new File(["image"], "another.jpg", { type: "image/jpeg" }),
      ];

      await act(async () => {
        await result.current.addImages(mockFiles);
      });

      // Should only add the 2 valid images
      expect(result.current.images).toHaveLength(2);
      expect(result.current.images[0].name).toBe("photo.png");
      expect(result.current.images[1].name).toBe("another.jpg");
    });

    it("should reject batch with zero valid images", async () => {
      const { result } = renderHook(() => useMessageImages());
      const mockFiles = [
        new File(["test"], "document.pdf", { type: "application/pdf" }),
        new File(["test"], "text.txt", { type: "text/plain" }),
      ];

      await expect(result.current.addImages(mockFiles)).rejects.toThrow(
        "No valid image files provided",
      );
    });
  });

  describe("removeImage", () => {
    it("should remove image by id", async () => {
      const { result } = renderHook(() => useMessageImages());
      const mockFile = new File(["image"], "photo.png", { type: "image/png" });

      await act(async () => {
        await result.current.addImage(mockFile);
      });

      const imageId = result.current.images[0].id;

      act(() => {
        result.current.removeImage(imageId);
      });

      expect(result.current.images).toHaveLength(0);
    });

    it("should handle removing non-existent image gracefully", async () => {
      const { result } = renderHook(() => useMessageImages());
      const mockFile = new File(["image"], "photo.png", { type: "image/png" });

      await act(async () => {
        await result.current.addImage(mockFile);
      });

      // Try to remove with a fake ID - should not throw or affect existing images
      act(() => {
        result.current.removeImage("non-existent-id");
      });

      // Original image should still be there
      expect(result.current.images).toHaveLength(1);
    });

    it("should only remove the targeted image", async () => {
      const { result } = renderHook(() => useMessageImages());
      const files = [
        new File(["image1"], "photo1.png", { type: "image/png" }),
        new File(["image2"], "photo2.png", { type: "image/png" }),
        new File(["image3"], "photo3.png", { type: "image/png" }),
      ];

      await act(async () => {
        await result.current.addImages(files);
      });

      const middleImageId = result.current.images[1].id;

      act(() => {
        result.current.removeImage(middleImageId);
      });

      expect(result.current.images).toHaveLength(2);
      expect(result.current.images[0].name).toBe("photo1.png");
      expect(result.current.images[1].name).toBe("photo3.png");
    });
  });

  describe("clearImages", () => {
    it("should remove all images", async () => {
      const { result } = renderHook(() => useMessageImages());
      const files = [
        new File(["image1"], "photo1.png", { type: "image/png" }),
        new File(["image2"], "photo2.png", { type: "image/png" }),
      ];

      await act(async () => {
        await result.current.addImages(files);
      });

      expect(result.current.images).toHaveLength(2);

      act(() => {
        result.current.clearImages();
      });

      expect(result.current.images).toHaveLength(0);
    });
  });
});
