import { act, renderHook } from "@testing-library/react";
import { useMessageFiles } from "../use-message-files";

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: jest.fn(() => "mock-uuid-" + Math.random()),
} as any;

// Mock FileReader with proper implementation
class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;
  readAsDataURL(_file: File) {
    this.result = "data:image/png;base64,mock-data";
    setTimeout(() => {
      if (this.onload) {
        this.onload.call(this as any, {} as any);
      }
    }, 0);
  }
  readAsText(_file: File) {
    this.result = "Mock text content";
    setTimeout(() => {
      if (this.onload) {
        this.onload.call(this as any, {} as any);
      }
    }, 0);
  }
}

(global as any).FileReader = MockFileReader;

// Mock File.arrayBuffer
if (typeof File !== "undefined") {
  File.prototype.arrayBuffer = jest.fn(async function (this: File) {
    return await Promise.resolve(new ArrayBuffer(8));
  });
}

describe("useMessageFiles", () => {
  beforeEach(() => {
    // Mock fetch for PDF API calls
    global.fetch = jest.fn(
      async () =>
        await Promise.resolve({
          ok: true,
          json: async () => ({ text: "Mock PDF text", pages: 1 }),
          text: async () => "",
        } as any),
    );
  });
  it("should initialize with empty files array", () => {
    const { result } = renderHook(() => useMessageFiles());
    expect(result.current.files).toEqual([]);
  });
  it("should reject non-supported files", async () => {
    const { result } = renderHook(() => useMessageFiles());
    const mockFile = new File(["test"], "test-document.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    await expect(result.current.addFile(mockFile)).rejects.toThrow(
      "Unsupported file type",
    );
  });
  it("should accept image files", async () => {
    const { result } = renderHook(() => useMessageFiles());
    const mockFile = new File(["test"], "test-image.png", {
      type: "image/png",
    });
    await act(async () => {
      await result.current.addFile(mockFile);
    });
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].contentType).toBe("image");
    expect(result.current.files[0].storagePath).toBeDefined();
  });
  it("should accept PDF files", async () => {
    const { result } = renderHook(() => useMessageFiles());
    const mockFile = new File(["test"], "test-document.pdf", {
      type: "application/pdf",
    });
    await act(async () => {
      await result.current.addFile(mockFile);
    });
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].contentType).toBe("text");
    expect(result.current.files[0].storagePath).toBeDefined();
  });
  it("should accept text files", async () => {
    const { result } = renderHook(() => useMessageFiles());
    const mockFile = new File(["test content"], "test.txt", {
      type: "text/plain",
    });
    await act(async () => {
      await result.current.addFile(mockFile);
    });
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].contentType).toBe("text");
    expect(result.current.files[0].storagePath).toBeDefined();
  });
  it("should clear all files", () => {
    const { result } = renderHook(() => useMessageFiles());
    act(() => {
      result.current.clearFiles();
    });
    expect(result.current.files).toHaveLength(0);
  });
  it("should handle file management correctly", () => {
    const { result } = renderHook(() => useMessageFiles());
    expect(typeof result.current.addFile).toBe("function");
    expect(typeof result.current.addFiles).toBe("function");
    expect(typeof result.current.removeFile).toBe("function");
    expect(typeof result.current.clearFiles).toBe("function");
  });
  it("should reject when no supported files provided to addFiles", async () => {
    const { result } = renderHook(() => useMessageFiles());
    const mockFiles = [
      new File(["test"], "document.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      new File(["test"], "spreadsheet.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    ];
    await expect(result.current.addFiles(mockFiles)).rejects.toThrow(
      "No supported files provided",
    );
  });
  it("should filter out unsupported files when adding multiple files", async () => {
    const { result } = renderHook(() => useMessageFiles());
    const mockFiles = [
      new File(["test"], "image.png", { type: "image/png" }),
      new File(["test"], "document.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      new File(["test"], "text.txt", { type: "text/plain" }),
    ];
    await act(async () => {
      await result.current.addFiles(mockFiles);
    });
    expect(result.current.files).toHaveLength(2);
  });
});
