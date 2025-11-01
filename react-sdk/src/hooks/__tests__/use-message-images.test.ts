import { act, renderHook } from "@testing-library/react";
import { useMessageAttachments, useMessageImages } from "../use-message-images";

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: jest.fn(() => "mock-uuid-" + Math.random()),
} as any;

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  onload: null as any,
  onerror: null as any,
  result: "data:image/png;base64,mock-data",
};

(global as any).FileReader = jest.fn(createMockFileReader);

const fileReaderMock = (global as any).FileReader as jest.Mock;

function createMockFileReader() {
  const reader = { ...mockFileReader };
  reader.readAsDataURL = jest.fn(() => {
    setTimeout(() => {
      if (reader.onload) {
        reader.onload({} as any);
      }
    }, 0);
  });
  return reader;
}

describe("useMessageImages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fileReaderMock.mockImplementation(createMockFileReader);
  });

  it("should initialize with empty images array", () => {
    const { result } = renderHook(() => useMessageImages());
    expect(result.current.images).toEqual([]);
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

  it("should clear all images", () => {
    const { result } = renderHook(() => useMessageImages());

    act(() => {
      result.current.clearImages();
    });

    expect(result.current.images).toHaveLength(0);
  });

  it("should handle image validation correctly", () => {
    const { result } = renderHook(() => useMessageImages());

    // Test that hooks are available
    expect(typeof result.current.addImage).toBe("function");
    expect(typeof result.current.addImages).toBe("function");
    expect(typeof result.current.removeImage).toBe("function");
    expect(typeof result.current.clearImages).toBe("function");
  });

  it("should reject when no valid image files provided to addImages", async () => {
    const { result } = renderHook(() => useMessageImages());
    const mockFiles = [
      new File(["test"], "document.pdf", { type: "application/pdf" }),
      new File(["test"], "text.txt", { type: "text/plain" }),
    ];

    await expect(result.current.addImages(mockFiles)).rejects.toThrow(
      "Only image files are allowed",
    );
  });
});

describe("useMessageAttachments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fileReaderMock.mockImplementation(createMockFileReader);
  });

  it("rejects non-image files", async () => {
    const { result } = renderHook(() => useMessageAttachments());
    const mockFile = new File(["hello"], "notes.txt", { type: "text/plain" });

    await expect(result.current.addAttachment(mockFile)).rejects.toThrow(
      "Only image attachments are supported. Extend detectAttachmentKind to enable additional file types.",
    );

    expect(result.current.attachments).toHaveLength(0);
  });

  it("stages image files", async () => {
    const { result } = renderHook(() => useMessageAttachments());
    const mockFile = new File([""], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current.addAttachment(mockFile);
    });

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0]).toMatchObject({
      name: "photo.png",
      kind: "image",
      type: "image/png",
    });
  });

  it("clears all attachments", async () => {
    const { result } = renderHook(() => useMessageAttachments());
    const files = [
      new File([""], "file1.png", { type: "image/png" }),
      new File([""], "file2.png", { type: "image/png" }),
    ];

    await act(async () => {
      await result.current.addAttachments(files);
    });

    expect(result.current.attachments).toHaveLength(2);

    act(() => {
      result.current.clearAttachments();
    });

    expect(result.current.attachments).toHaveLength(0);
  });
});
