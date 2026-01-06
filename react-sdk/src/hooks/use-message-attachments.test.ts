import { act, renderHook } from "@testing-library/react";
import {
  useMessageAttachments,
  useMessageImages,
} from "./use-message-attachments";

// Helper to create mock File objects
function createMockFile(
  name: string,
  size: number,
  type: string,
  content = "test content",
): File {
  // Create content of the specified size
  const actualContent = content.padEnd(size, "x").slice(0, size);
  const blob = new Blob([actualContent], { type });
  return new File([blob], name, { type });
}

describe("useMessageAttachments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with empty staged attachments", () => {
      const { result } = renderHook(() => useMessageAttachments());

      expect(result.current.stagedAttachments).toEqual([]);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.hasErrors).toBe(false);
    });
  });

  describe("addAttachments", () => {
    it("should add a valid image attachment", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const file = createMockFile("test.png", 1024, "image/png");

      await act(async () => {
        await result.current.addAttachments([file]);
      });

      expect(result.current.stagedAttachments).toHaveLength(1);
      expect(result.current.stagedAttachments[0]).toMatchObject({
        name: "test.png",
        mimeType: "image/png",
        status: "uploaded",
      });
      expect(result.current.stagedAttachments[0].preview?.type).toBe("image");
    });

    it("should add a valid PDF attachment", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const file = createMockFile("document.pdf", 2048, "application/pdf");

      await act(async () => {
        await result.current.addAttachments([file]);
      });

      expect(result.current.stagedAttachments).toHaveLength(1);
      expect(result.current.stagedAttachments[0]).toMatchObject({
        name: "document.pdf",
        mimeType: "application/pdf",
        status: "uploaded",
      });
      expect(result.current.stagedAttachments[0].preview?.type).toBe("generic");
    });

    it("should add a valid text attachment with preview", async () => {
      const textContent = "This is some sample text content for the file";
      const { result } = renderHook(() => useMessageAttachments());

      const file = createMockFile(
        "readme.txt",
        textContent.length,
        "text/plain",
        textContent,
      );
      // Mock file.text() for preview generation - directly assign since spyOn doesn't work on Blob methods
      file.text = jest.fn().mockResolvedValue(textContent);

      await act(async () => {
        await result.current.addAttachments([file]);
      });

      expect(result.current.stagedAttachments).toHaveLength(1);
      expect(result.current.stagedAttachments[0]).toMatchObject({
        name: "readme.txt",
        mimeType: "text/plain",
        status: "uploaded",
      });
      expect(result.current.stagedAttachments[0].preview?.type).toBe("text");
      expect(
        result.current.stagedAttachments[0].preview?.textPreview,
      ).toContain("This is some sample");
    });

    it("should add multiple attachments at once", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const files = [
        createMockFile("test1.png", 1024, "image/png"),
        createMockFile("test2.jpg", 2048, "image/jpeg"),
      ];

      await act(async () => {
        await result.current.addAttachments(files);
      });

      expect(result.current.stagedAttachments).toHaveLength(2);
    });

    it("should return newly created attachments", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const file = createMockFile("test.png", 1024, "image/png");

      let returnedAttachments: Awaited<
        ReturnType<typeof result.current.addAttachments>
      >;
      await act(async () => {
        returnedAttachments = await result.current.addAttachments([file]);
      });

      expect(returnedAttachments!).toHaveLength(1);
      expect(returnedAttachments![0].name).toBe("test.png");
    });

    it("should generate dataUrl for attachments", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const file = createMockFile("test.png", 100, "image/png");

      await act(async () => {
        await result.current.addAttachments([file]);
      });

      expect(result.current.stagedAttachments[0].dataUrl).toMatch(
        /^data:image\/png;base64,/,
      );
    });

    it("should infer MIME type from extension when type is octet-stream", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      // Create a file with octet-stream type (browser default for unknown)
      const blob = new Blob(["content"], { type: "application/octet-stream" });
      const file = new File([blob], "readme.md", {
        type: "application/octet-stream",
      });

      await act(async () => {
        await result.current.addAttachments([file]);
      });

      expect(result.current.stagedAttachments).toHaveLength(1);
      expect(result.current.stagedAttachments[0].mimeType).toBe(
        "text/markdown",
      );
    });

    it("should accumulate attachments from multiple calls", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      await act(async () => {
        await result.current.addAttachments([
          createMockFile("test1.png", 1024, "image/png"),
        ]);
      });

      await act(async () => {
        await result.current.addAttachments([
          createMockFile("test2.png", 1024, "image/png"),
        ]);
      });

      expect(result.current.stagedAttachments).toHaveLength(2);
    });
  });

  describe("validation errors", () => {
    it("should reject unsupported file types", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const file = createMockFile("test.exe", 1024, "application/x-msdownload");

      await expect(result.current.addAttachments([file])).rejects.toThrow(
        /unsupported type/i,
      );

      expect(result.current.stagedAttachments).toHaveLength(0);
    });

    it("should reject files exceeding individual size limit (50MB)", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      // 51MB file (over 50MB limit)
      const file = createMockFile("large.png", 51 * 1024 * 1024, "image/png");

      await expect(result.current.addAttachments([file])).rejects.toThrow(
        /too large/i,
      );

      expect(result.current.stagedAttachments).toHaveLength(0);
    });

    it("should reject when exceeding max attachment count (10)", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      // Add 10 files first (at the limit)
      const initialFiles = Array.from({ length: 10 }, (_, i) =>
        createMockFile(`test${i}.png`, 100, "image/png"),
      );

      await act(async () => {
        await result.current.addAttachments(initialFiles);
      });

      expect(result.current.stagedAttachments).toHaveLength(10);

      // Try to add one more
      const extraFile = createMockFile("extra.png", 100, "image/png");

      await expect(result.current.addAttachments([extraFile])).rejects.toThrow(
        /maximum.*10/i,
      );
    });

    it("should reject when exceeding total size limit (100MB)", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      // Add two 40MB files first (80MB total, under 100MB limit)
      const file1 = createMockFile("file1.png", 40 * 1024 * 1024, "image/png");
      const file2 = createMockFile("file2.png", 40 * 1024 * 1024, "image/png");

      await act(async () => {
        await result.current.addAttachments([file1, file2]);
      });

      expect(result.current.stagedAttachments).toHaveLength(2);

      // Try to add a 30MB file (would exceed 100MB total: 40 + 40 + 30 = 110MB)
      const anotherLargeFile = createMockFile(
        "another.png",
        30 * 1024 * 1024,
        "image/png",
      );

      await expect(
        result.current.addAttachments([anotherLargeFile]),
      ).rejects.toThrow(/total.*exceed.*100MB/i);
    });

    it("should reject files with unknown extension and no MIME type", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const blob = new Blob(["content"]);
      const file = new File([blob], "unknownfile", { type: "" });

      await expect(result.current.addAttachments([file])).rejects.toThrow(
        /unsupported type/i,
      );
    });

    it("should provide helpful error for unknown file types", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const file = createMockFile("test.xyz", 1024, "application/xyz");

      await expect(result.current.addAttachments([file])).rejects.toThrow(
        /Supported:/i,
      );
    });
  });

  describe("removeAttachment", () => {
    it("should remove an attachment by ID", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const files = [
        createMockFile("test1.png", 1024, "image/png"),
        createMockFile("test2.png", 2048, "image/png"),
      ];

      await act(async () => {
        await result.current.addAttachments(files);
      });

      expect(result.current.stagedAttachments).toHaveLength(2);

      const idToRemove = result.current.stagedAttachments[0].id;

      act(() => {
        result.current.removeAttachment(idToRemove);
      });

      expect(result.current.stagedAttachments).toHaveLength(1);
      expect(result.current.stagedAttachments[0].name).toBe("test2.png");
    });

    it("should do nothing if ID does not exist", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const file = createMockFile("test.png", 1024, "image/png");

      await act(async () => {
        await result.current.addAttachments([file]);
      });

      act(() => {
        result.current.removeAttachment("non-existent-id");
      });

      expect(result.current.stagedAttachments).toHaveLength(1);
    });
  });

  describe("clearAttachments", () => {
    it("should remove all attachments", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const files = [
        createMockFile("test1.png", 1024, "image/png"),
        createMockFile("test2.png", 2048, "image/png"),
      ];

      await act(async () => {
        await result.current.addAttachments(files);
      });

      expect(result.current.stagedAttachments).toHaveLength(2);

      act(() => {
        result.current.clearAttachments();
      });

      expect(result.current.stagedAttachments).toHaveLength(0);
    });

    it("should work when already empty", () => {
      const { result } = renderHook(() => useMessageAttachments());

      act(() => {
        result.current.clearAttachments();
      });

      expect(result.current.stagedAttachments).toHaveLength(0);
    });
  });

  describe("CSV preview", () => {
    it("should generate CSV preview with dimensions", async () => {
      const csvContent =
        "header1,header2,header3\nrow1col1,row1col2,row1col3\nrow2col1,row2col2,row2col3";
      const { result } = renderHook(() => useMessageAttachments());

      const file = createMockFile(
        "data.csv",
        csvContent.length,
        "text/csv",
        csvContent,
      );
      // Mock file.text() for CSV parsing - directly assign since spyOn doesn't work on Blob methods
      file.text = jest.fn().mockResolvedValue(csvContent);

      await act(async () => {
        await result.current.addAttachments([file]);
      });

      expect(result.current.stagedAttachments[0].preview).toMatchObject({
        type: "csv",
        dimensions: {
          rows: 3,
          columns: 3,
        },
      });
    });

    it("should handle empty CSV gracefully", async () => {
      const csvContent = "";
      const { result } = renderHook(() => useMessageAttachments());

      const file = createMockFile("empty.csv", 1, "text/csv", csvContent);
      // Mock file.text() for CSV parsing - directly assign since spyOn doesn't work on Blob methods
      file.text = jest.fn().mockResolvedValue(csvContent);

      await act(async () => {
        await result.current.addAttachments([file]);
      });

      // Empty string split on newline returns [""] with length 1
      expect(result.current.stagedAttachments[0].preview).toMatchObject({
        type: "csv",
        dimensions: {
          rows: 1,
          columns: 0,
        },
      });
    });
  });

  describe("supported file types", () => {
    const supportedTypes = [
      { name: "test.jpg", type: "image/jpeg" },
      { name: "test.jpeg", type: "image/jpeg" },
      { name: "test.png", type: "image/png" },
      { name: "test.gif", type: "image/gif" },
      { name: "test.webp", type: "image/webp" },
      { name: "test.pdf", type: "application/pdf" },
      { name: "test.txt", type: "text/plain" },
      { name: "test.md", type: "text/markdown" },
      { name: "test.csv", type: "text/csv" },
      { name: "test.html", type: "text/html" },
      { name: "test.js", type: "text/javascript" },
      { name: "test.ts", type: "text/typescript" },
      { name: "test.json", type: "application/json" },
      { name: "test.xml", type: "application/xml" },
    ];

    it.each(supportedTypes)(
      "should accept $name with type $type",
      async ({ name, type }) => {
        const { result } = renderHook(() => useMessageAttachments());

        const file = createMockFile(name, 1024, type);

        await act(async () => {
          await result.current.addAttachments([file]);
        });

        expect(result.current.stagedAttachments).toHaveLength(1);
        expect(result.current.stagedAttachments[0].mimeType).toBe(type);
      },
    );
  });

  describe("extension-based MIME type inference", () => {
    const extensionMappings = [
      { ext: "jpg", expectedType: "image/jpeg" },
      { ext: "jpeg", expectedType: "image/jpeg" },
      { ext: "png", expectedType: "image/png" },
      { ext: "gif", expectedType: "image/gif" },
      { ext: "webp", expectedType: "image/webp" },
      { ext: "pdf", expectedType: "application/pdf" },
      { ext: "txt", expectedType: "text/plain" },
      { ext: "text", expectedType: "text/plain" },
      { ext: "md", expectedType: "text/markdown" },
      { ext: "markdown", expectedType: "text/markdown" },
      { ext: "csv", expectedType: "text/csv" },
      { ext: "html", expectedType: "text/html" },
      { ext: "htm", expectedType: "text/html" },
      { ext: "js", expectedType: "text/javascript" },
      { ext: "ts", expectedType: "text/typescript" },
      { ext: "json", expectedType: "application/json" },
      { ext: "xml", expectedType: "application/xml" },
    ];

    it.each(extensionMappings)(
      "should infer $expectedType from .$ext extension",
      async ({ ext, expectedType }) => {
        const { result } = renderHook(() => useMessageAttachments());

        // Create file with octet-stream type to force extension inference
        const blob = new Blob(["content"], {
          type: "application/octet-stream",
        });
        const file = new File([blob], `test.${ext}`, {
          type: "application/octet-stream",
        });

        await act(async () => {
          await result.current.addAttachments([file]);
        });

        expect(result.current.stagedAttachments).toHaveLength(1);
        expect(result.current.stagedAttachments[0].mimeType).toBe(expectedType);
      },
    );
  });

  describe("text/* MIME type fallback", () => {
    it("should accept any text/* MIME type", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const file = createMockFile("test.custom", 1024, "text/x-custom");

      await act(async () => {
        await result.current.addAttachments([file]);
      });

      expect(result.current.stagedAttachments).toHaveLength(1);
      expect(result.current.stagedAttachments[0].mimeType).toBe(
        "text/x-custom",
      );
    });
  });

  describe("backwards compatibility", () => {
    it("should export useMessageImages as alias", () => {
      expect(useMessageImages).toBe(useMessageAttachments);
    });

    it("useMessageImages should work the same as useMessageAttachments", async () => {
      const { result } = renderHook(() => useMessageImages());

      const file = createMockFile("test.png", 1024, "image/png");

      await act(async () => {
        await result.current.addAttachments([file]);
      });

      expect(result.current.stagedAttachments).toHaveLength(1);
    });
  });

  describe("unique IDs", () => {
    it("should generate unique IDs for each attachment", async () => {
      const { result } = renderHook(() => useMessageAttachments());

      const files = [
        createMockFile("test1.png", 1024, "image/png"),
        createMockFile("test2.png", 1024, "image/png"),
        createMockFile("test3.png", 1024, "image/png"),
      ];

      await act(async () => {
        await result.current.addAttachments(files);
      });

      const ids = result.current.stagedAttachments.map((a) => a.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });
  });
});
