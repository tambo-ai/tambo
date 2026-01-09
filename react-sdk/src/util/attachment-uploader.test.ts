import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  uploadAttachment,
  AttachmentUploadError,
  MAX_ATTACHMENT_SIZE,
} from "./attachment-uploader";

// Mock fetch globally
const mockFetch = jest.fn<typeof fetch>();
let previousFetch: typeof fetch;

beforeEach(() => {
  previousFetch = global.fetch;
  global.fetch = mockFetch;
});

afterEach(() => {
  global.fetch = previousFetch;
});

// Create typed mock for client.post
const mockPost =
  jest.fn<(path: string, options: { body: unknown }) => Promise<unknown>>();

describe("attachment-uploader", () => {
  const mockClient = {
    post: mockPost,
  };

  const createMockFile = (name: string, size: number, type: string): File => {
    const content = new Array(size).fill("a").join("");
    return new File([content], name, { type });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("MAX_ATTACHMENT_SIZE", () => {
    it("should be 10MB", () => {
      expect(MAX_ATTACHMENT_SIZE).toBe(10 * 1024 * 1024);
    });
  });

  describe("uploadAttachment", () => {
    describe("size validation", () => {
      it("should reject files exceeding 10MB before making any API calls", async () => {
        const largeFile = createMockFile(
          "large.pdf",
          MAX_ATTACHMENT_SIZE + 1,
          "application/pdf",
        );

        await expect(
          uploadAttachment(
            mockClient as never,
            largeFile,
            "application/pdf",
            "document",
          ),
        ).rejects.toThrow(AttachmentUploadError);

        await expect(
          uploadAttachment(
            mockClient as never,
            largeFile,
            "application/pdf",
            "document",
          ),
        ).rejects.toThrow("exceeds the maximum size of 10MB");

        // Should NOT have made any API calls
        expect(mockPost).not.toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it("should accept files at exactly 10MB", async () => {
        const exactFile = createMockFile(
          "exact.pdf",
          MAX_ATTACHMENT_SIZE,
          "application/pdf",
        );

        mockPost.mockResolvedValue({
          uploadUrl: "https://s3.example.com/upload",
          attachmentUri: "attachment://proj/abc123",
          expiresIn: 3600,
        });

        mockFetch.mockResolvedValue({
          ok: true,
        } as Response);

        const result = await uploadAttachment(
          mockClient as never,
          exactFile,
          "application/pdf",
          "document",
        );

        expect(result.attachmentUri).toBe("attachment://proj/abc123");
      });
    });

    describe("successful upload", () => {
      it("should complete the presign and upload flow", async () => {
        const file = createMockFile("test.pdf", 1024, "application/pdf");

        mockPost.mockResolvedValue({
          uploadUrl: "https://s3.example.com/upload?signature=xyz",
          attachmentUri: "attachment://project123/fileABC",
          expiresIn: 3600,
        });

        mockFetch.mockResolvedValue({
          ok: true,
        } as Response);

        const result = await uploadAttachment(
          mockClient as never,
          file,
          "application/pdf",
          "document",
        );

        // Verify presign request
        expect(mockPost).toHaveBeenCalledWith("/storage/presign", {
          body: {
            contentType: "application/pdf",
            size: 1024,
          },
        });

        // Verify S3 upload
        expect(mockFetch).toHaveBeenCalledWith(
          "https://s3.example.com/upload?signature=xyz",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/pdf",
            },
            body: file,
          },
        );

        // Verify result
        expect(result).toEqual({
          attachmentUri: "attachment://project123/fileABC",
          filename: "test.pdf",
          mimeType: "application/pdf",
          attachmentType: "document",
        });
      });
    });

    describe("error handling", () => {
      it("should throw AttachmentUploadError for 503 (storage not configured)", async () => {
        const file = createMockFile("test.pdf", 1024, "application/pdf");

        mockPost.mockRejectedValue(new Error("503 Service Unavailable"));

        await expect(
          uploadAttachment(
            mockClient as never,
            file,
            "application/pdf",
            "document",
          ),
        ).rejects.toThrow("File uploads require storage configuration");
      });

      it("should throw AttachmentUploadError for 400 (validation error)", async () => {
        const file = createMockFile("test.pdf", 1024, "application/pdf");

        mockPost.mockRejectedValue(new Error("400 Bad Request"));

        await expect(
          uploadAttachment(
            mockClient as never,
            file,
            "application/pdf",
            "document",
          ),
        ).rejects.toThrow("exceeds the maximum size of 10MB");
      });

      it("should throw AttachmentUploadError for other presign errors", async () => {
        const file = createMockFile("test.pdf", 1024, "application/pdf");

        mockPost.mockRejectedValue(new Error("Network error"));

        await expect(
          uploadAttachment(
            mockClient as never,
            file,
            "application/pdf",
            "document",
          ),
        ).rejects.toThrow("Failed to get upload URL");
      });

      it("should throw AttachmentUploadError for S3 upload failure", async () => {
        const file = createMockFile("test.pdf", 1024, "application/pdf");

        mockPost.mockResolvedValue({
          uploadUrl: "https://s3.example.com/upload",
          attachmentUri: "attachment://proj/abc123",
          expiresIn: 3600,
        });

        mockFetch.mockResolvedValue({
          ok: false,
          status: 403,
        } as Response);

        await expect(
          uploadAttachment(
            mockClient as never,
            file,
            "application/pdf",
            "document",
          ),
        ).rejects.toThrow("Failed to upload test.pdf to storage");
      });

      it("should throw AttachmentUploadError for S3 network failure", async () => {
        const file = createMockFile("test.pdf", 1024, "application/pdf");

        mockPost.mockResolvedValue({
          uploadUrl: "https://s3.example.com/upload",
          attachmentUri: "attachment://proj/abc123",
          expiresIn: 3600,
        });

        mockFetch.mockRejectedValue(new Error("Network error"));

        await expect(
          uploadAttachment(
            mockClient as never,
            file,
            "application/pdf",
            "document",
          ),
        ).rejects.toThrow("Failed to upload test.pdf to storage");
      });
    });

    describe("AttachmentUploadError", () => {
      it("should include filename in error", async () => {
        const file = createMockFile(
          "important-doc.pdf",
          MAX_ATTACHMENT_SIZE + 1,
          "application/pdf",
        );

        let caughtError: AttachmentUploadError | undefined;
        try {
          await uploadAttachment(
            mockClient as never,
            file,
            "application/pdf",
            "document",
          );
        } catch (error) {
          caughtError = error as AttachmentUploadError;
        }

        expect(caughtError).toBeInstanceOf(AttachmentUploadError);
        expect(caughtError?.filename).toBe("important-doc.pdf");
      });

      it("should include cause for API errors", async () => {
        const file = createMockFile("test.pdf", 1024, "application/pdf");
        const originalError = new Error("503 Service Unavailable");

        mockPost.mockRejectedValue(originalError);

        let caughtError: AttachmentUploadError | undefined;
        try {
          await uploadAttachment(
            mockClient as never,
            file,
            "application/pdf",
            "document",
          );
        } catch (error) {
          caughtError = error as AttachmentUploadError;
        }

        expect(caughtError).toBeInstanceOf(AttachmentUploadError);
        expect(caughtError?.cause).toBe(originalError);
      });
    });
  });
});
