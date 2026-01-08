import { S3Client } from "@aws-sdk/client-s3";
import { createAttachmentFetcher } from "./attachment-fetcher";

// Mock the backend storage module
jest.mock("@tambo-ai-cloud/backend", () => ({
  getFile: jest.fn(),
}));

// Mock mime-types
jest.mock("mime-types", () => ({
  lookup: jest.fn(),
}));

describe("attachment-fetcher", () => {
  let mockS3Client: S3Client;
  let mockGetFile: jest.Mock;
  let mockMimeLookup: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Client = {} as S3Client;
    mockGetFile = jest.requireMock("@tambo-ai-cloud/backend").getFile;
    mockMimeLookup = jest.requireMock("mime-types").lookup;
  });

  describe("createAttachmentFetcher", () => {
    it("returns a function", () => {
      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      expect(typeof fetcher).toBe("function");
    });

    it("throws for invalid URI without attachment:// prefix", async () => {
      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");

      await expect(fetcher("file://some/path.pdf")).rejects.toThrow(
        'Invalid attachment URI: file://some/path.pdf. Must start with "attachment://"',
      );
    });

    it("correctly parses attachment:// URI and extracts storage path", async () => {
      mockGetFile.mockResolvedValue(Buffer.from("test content"));
      mockMimeLookup.mockReturnValue("text/plain");

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      await fetcher("attachment://proj_123/1704567890-doc.txt");

      expect(mockGetFile).toHaveBeenCalledWith(
        mockS3Client,
        "test-bucket",
        "proj_123/1704567890-doc.txt",
      );
    });

    it("returns text content for text MIME types", async () => {
      mockGetFile.mockResolvedValue(Buffer.from("Hello, world!"));
      mockMimeLookup.mockReturnValue("text/plain");

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      const result = await fetcher("attachment://proj_123/file.txt");

      expect(result).toEqual({
        contents: [
          {
            uri: "attachment://proj_123/file.txt",
            mimeType: "text/plain",
            text: "Hello, world!",
          },
        ],
      });
    });

    it("returns text content for application/json MIME type", async () => {
      mockGetFile.mockResolvedValue(Buffer.from('{"key": "value"}'));
      mockMimeLookup.mockReturnValue("application/json");

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      const result = await fetcher("attachment://proj_123/data.json");

      expect(result).toEqual({
        contents: [
          {
            uri: "attachment://proj_123/data.json",
            mimeType: "application/json",
            text: '{"key": "value"}',
          },
        ],
      });
    });

    it("returns base64 blob for binary MIME types", async () => {
      const binaryContent = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes
      mockGetFile.mockResolvedValue(binaryContent);
      mockMimeLookup.mockReturnValue("image/png");

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      const result = await fetcher("attachment://proj_123/image.png");

      expect(result).toEqual({
        contents: [
          {
            uri: "attachment://proj_123/image.png",
            mimeType: "image/png",
            blob: binaryContent.toString("base64"),
          },
        ],
      });
    });

    it("returns base64 blob for PDF MIME type", async () => {
      const pdfContent = Buffer.from("%PDF-1.4 test content");
      mockGetFile.mockResolvedValue(pdfContent);
      mockMimeLookup.mockReturnValue("application/pdf");

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      const result = await fetcher("attachment://proj_123/document.pdf");

      expect(result).toEqual({
        contents: [
          {
            uri: "attachment://proj_123/document.pdf",
            mimeType: "application/pdf",
            blob: pdfContent.toString("base64"),
          },
        ],
      });
    });

    it("uses application/octet-stream for unknown MIME types", async () => {
      mockGetFile.mockResolvedValue(Buffer.from("binary data"));
      mockMimeLookup.mockReturnValue(false); // mime-types returns false for unknown

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      const result = await fetcher("attachment://proj_123/unknown.xyz");

      expect(result.contents[0].mimeType).toBe("application/octet-stream");
      expect("blob" in result.contents[0]).toBe(true);
    });

    it("propagates errors from getFile", async () => {
      mockGetFile.mockRejectedValue(new Error("S3 access denied"));
      mockMimeLookup.mockReturnValue("text/plain");

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");

      await expect(fetcher("attachment://proj_123/file.txt")).rejects.toThrow(
        "S3 access denied",
      );
    });

    it("handles empty path after prefix", async () => {
      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");

      // This should call getFile with an empty path
      mockGetFile.mockResolvedValue(Buffer.from("content"));
      mockMimeLookup.mockReturnValue(false);

      await fetcher("attachment://");

      expect(mockGetFile).toHaveBeenCalledWith(mockS3Client, "test-bucket", "");
    });

    it("returns text content for text/html MIME type", async () => {
      mockGetFile.mockResolvedValue(
        Buffer.from("<html><body>Hello</body></html>"),
      );
      mockMimeLookup.mockReturnValue("text/html");

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      const result = await fetcher("attachment://proj_123/page.html");

      expect(result).toEqual({
        contents: [
          {
            uri: "attachment://proj_123/page.html",
            mimeType: "text/html",
            text: "<html><body>Hello</body></html>",
          },
        ],
      });
    });

    it("returns text content for application/xml MIME type", async () => {
      mockGetFile.mockResolvedValue(Buffer.from("<root><item/></root>"));
      mockMimeLookup.mockReturnValue("application/xml");

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      const result = await fetcher("attachment://proj_123/data.xml");

      expect(result).toEqual({
        contents: [
          {
            uri: "attachment://proj_123/data.xml",
            mimeType: "application/xml",
            text: "<root><item/></root>",
          },
        ],
      });
    });

    it("returns blob for audio MIME type", async () => {
      const audioContent = Buffer.from([0x49, 0x44, 0x33]); // ID3 tag
      mockGetFile.mockResolvedValue(audioContent);
      mockMimeLookup.mockReturnValue("audio/mpeg");

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      const result = await fetcher("attachment://proj_123/song.mp3");

      expect(result).toEqual({
        contents: [
          {
            uri: "attachment://proj_123/song.mp3",
            mimeType: "audio/mpeg",
            blob: audioContent.toString("base64"),
          },
        ],
      });
    });

    it("returns blob for video MIME type", async () => {
      const videoContent = Buffer.from([0x00, 0x00, 0x00, 0x1c]); // MP4 start
      mockGetFile.mockResolvedValue(videoContent);
      mockMimeLookup.mockReturnValue("video/mp4");

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      const result = await fetcher("attachment://proj_123/video.mp4");

      expect(result).toEqual({
        contents: [
          {
            uri: "attachment://proj_123/video.mp4",
            mimeType: "video/mp4",
            blob: videoContent.toString("base64"),
          },
        ],
      });
    });

    it("handles nested path in URI", async () => {
      mockGetFile.mockResolvedValue(Buffer.from("content"));
      mockMimeLookup.mockReturnValue("text/plain");

      const fetcher = createAttachmentFetcher(mockS3Client, "test-bucket");
      await fetcher("attachment://proj_123/folder/subfolder/file.txt");

      expect(mockGetFile).toHaveBeenCalledWith(
        mockS3Client,
        "test-bucket",
        "proj_123/folder/subfolder/file.txt",
      );
    });
  });
});
