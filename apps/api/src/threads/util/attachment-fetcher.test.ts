import { S3Client } from "@aws-sdk/client-s3";
import { createAttachmentFetcher } from "./attachment-fetcher";
import { buildStorageKey } from "@tambo-ai-cloud/core";

// Mock the backend storage module
jest.mock("@tambo-ai-cloud/backend", () => ({
  getFile: jest.fn(),
}));

const TEST_PROJECT_ID = "p_u2tgQg5U.43bbdf";
const TEST_BUCKET = "test-bucket";
const TEST_SECRET = "test-signing-secret";
const TEST_UNIQUE_ID = "Ab3xY9kLmN";

describe("attachment-fetcher", () => {
  let mockS3Client: S3Client;
  let mockGetFile: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Client = {} as S3Client;
    mockGetFile = jest.requireMock("@tambo-ai-cloud/backend").getFile;
  });

  describe("createAttachmentFetcher", () => {
    it("returns a function", () => {
      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );
      expect(typeof fetcher).toBe("function");
    });

    it("throws if allowedProjectId is empty", () => {
      expect(() =>
        createAttachmentFetcher(mockS3Client, TEST_BUCKET, "", TEST_SECRET),
      ).toThrow("allowedProjectId must be non-empty");
    });

    it("throws if signingSecret is empty", () => {
      expect(() =>
        createAttachmentFetcher(mockS3Client, TEST_BUCKET, TEST_PROJECT_ID, ""),
      ).toThrow("signingSecret must be non-empty");
    });

    it("throws for invalid URI without attachment:// prefix", async () => {
      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      await expect(fetcher("file://some/path.pdf")).rejects.toThrow(
        'Invalid attachment URI: file://some/path.pdf. Must start with "attachment://"',
      );
    });

    it("correctly parses attachment:// URI and reconstructs storage key with signature", async () => {
      mockGetFile.mockResolvedValue({
        buffer: Buffer.from("test content"),
        contentType: "application/octet-stream",
      });

      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      await fetcher(uri);

      // The storage key should include the signature
      const expectedStorageKey = buildStorageKey(
        TEST_PROJECT_ID,
        TEST_UNIQUE_ID,
        TEST_SECRET,
      );
      expect(mockGetFile).toHaveBeenCalledWith(
        mockS3Client,
        TEST_BUCKET,
        expectedStorageKey,
      );
    });

    it("returns text content for text MIME types", async () => {
      mockGetFile.mockResolvedValue({
        buffer: Buffer.from("Hello, world!"),
        contentType: "text/plain",
      });

      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const result = await fetcher(uri);

      expect(result).toEqual({
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: "Hello, world!",
          },
        ],
      });
    });

    it("returns text content for application/json MIME type", async () => {
      mockGetFile.mockResolvedValue({
        buffer: Buffer.from('{"key": "value"}'),
        contentType: "application/json",
      });

      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const result = await fetcher(uri);

      expect(result).toEqual({
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: '{"key": "value"}',
          },
        ],
      });
    });

    it("returns base64 blob for binary MIME types", async () => {
      const binaryContent = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes
      mockGetFile.mockResolvedValue({
        buffer: binaryContent,
        contentType: "image/png",
      });

      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const result = await fetcher(uri);

      expect(result).toEqual({
        contents: [
          {
            uri,
            mimeType: "image/png",
            blob: binaryContent.toString("base64"),
          },
        ],
      });
    });

    it("returns base64 blob for PDF MIME type", async () => {
      const pdfContent = Buffer.from("%PDF-1.4 test content");
      mockGetFile.mockResolvedValue({
        buffer: pdfContent,
        contentType: "application/pdf",
      });

      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const result = await fetcher(uri);

      expect(result).toEqual({
        contents: [
          {
            uri,
            mimeType: "application/pdf",
            blob: pdfContent.toString("base64"),
          },
        ],
      });
    });

    it("uses application/octet-stream for unknown MIME types", async () => {
      mockGetFile.mockResolvedValue({
        buffer: Buffer.from("binary data"),
        contentType: "application/octet-stream",
      });

      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const result = await fetcher(uri);

      expect(result.contents[0].mimeType).toBe("application/octet-stream");
      expect("blob" in result.contents[0]).toBe(true);
    });

    it("propagates errors from getFile", async () => {
      mockGetFile.mockRejectedValue(new Error("S3 access denied"));

      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      await expect(fetcher(uri)).rejects.toThrow("S3 access denied");
    });

    it("rejects empty path after prefix", async () => {
      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      await expect(fetcher("attachment://")).rejects.toThrow(
        "Invalid attachment URI: attachment://. Missing path.",
      );
    });

    it("rejects attachments that do not match the allowed project ID", async () => {
      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      await expect(
        fetcher(`attachment://p_other1234.43bbdf/${TEST_UNIQUE_ID}`),
      ).rejects.toThrow("Attachment access denied");
    });

    it("rejects URIs with backslashes", async () => {
      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      await expect(
        fetcher(`attachment://${TEST_PROJECT_ID}\\${TEST_UNIQUE_ID}`),
      ).rejects.toThrow("Invalid attachment URI");
    });

    it("rejects URIs with double slashes in path", async () => {
      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      await expect(
        fetcher(`attachment://${TEST_PROJECT_ID}//${TEST_UNIQUE_ID}`),
      ).rejects.toThrow("Invalid attachment URI");
    });

    it("rejects URIs missing uniqueId", async () => {
      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      await expect(fetcher(`attachment://${TEST_PROJECT_ID}/`)).rejects.toThrow(
        "Invalid attachment URI",
      );
    });

    it("rejects URIs with invalid uniqueId format (extra path segments)", async () => {
      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      await expect(
        fetcher(`attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}/extra`),
      ).rejects.toThrow("uniqueId must be exactly 10 alphanumeric characters");
    });

    it("rejects URIs with uniqueId that's too short", async () => {
      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      await expect(
        fetcher(`attachment://${TEST_PROJECT_ID}/abc123`),
      ).rejects.toThrow("uniqueId must be exactly 10 alphanumeric characters");
    });

    it("rejects URIs with uniqueId containing special characters", async () => {
      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      await expect(
        fetcher(`attachment://${TEST_PROJECT_ID}/Ab3_Y9-LmN`),
      ).rejects.toThrow("uniqueId must be exactly 10 alphanumeric characters");
    });

    it("returns text content for text/html MIME type", async () => {
      mockGetFile.mockResolvedValue({
        buffer: Buffer.from("<html><body>Hello</body></html>"),
        contentType: "text/html",
      });

      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const result = await fetcher(uri);

      expect(result).toEqual({
        contents: [
          {
            uri,
            mimeType: "text/html",
            text: "<html><body>Hello</body></html>",
          },
        ],
      });
    });

    it("returns text content for application/xml MIME type", async () => {
      mockGetFile.mockResolvedValue({
        buffer: Buffer.from("<root><item/></root>"),
        contentType: "application/xml",
      });

      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const result = await fetcher(uri);

      expect(result).toEqual({
        contents: [
          {
            uri,
            mimeType: "application/xml",
            text: "<root><item/></root>",
          },
        ],
      });
    });

    it("returns blob for audio MIME type", async () => {
      const audioContent = Buffer.from([0x49, 0x44, 0x33]); // ID3 tag
      mockGetFile.mockResolvedValue({
        buffer: audioContent,
        contentType: "audio/mpeg",
      });

      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const result = await fetcher(uri);

      expect(result).toEqual({
        contents: [
          {
            uri,
            mimeType: "audio/mpeg",
            blob: audioContent.toString("base64"),
          },
        ],
      });
    });

    it("returns blob for video MIME type", async () => {
      const videoContent = Buffer.from([0x00, 0x00, 0x00, 0x1c]); // MP4 start
      mockGetFile.mockResolvedValue({
        buffer: videoContent,
        contentType: "video/mp4",
      });

      const fetcher = createAttachmentFetcher(
        mockS3Client,
        TEST_BUCKET,
        TEST_PROJECT_ID,
        TEST_SECRET,
      );

      const uri = `attachment://${TEST_PROJECT_ID}/${TEST_UNIQUE_ID}`;
      const result = await fetcher(uri);

      expect(result).toEqual({
        contents: [
          {
            uri,
            mimeType: "video/mp4",
            blob: videoContent.toString("base64"),
          },
        ],
      });
    });
  });
});
