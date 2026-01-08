import { S3Client } from "@aws-sdk/client-s3";
import {
  ensureBucket,
  getFile,
  getSignedUploadUrl,
  uploadFile,
} from "./operations";

// Mock the AWS SDK
jest.mock("@aws-sdk/client-s3", () => {
  const mockSend = jest.fn();
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutObjectCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      _type: "PutObjectCommand",
    })),
    GetObjectCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      _type: "GetObjectCommand",
    })),
    HeadBucketCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      _type: "HeadBucketCommand",
    })),
    CreateBucketCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      _type: "CreateBucketCommand",
    })),
  };
});

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue("https://presigned-url.example.com"),
}));

describe("storage operations", () => {
  let mockClient: jest.Mocked<S3Client>;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend = jest.fn();
    mockClient = { send: mockSend } as unknown as jest.Mocked<S3Client>;
  });

  describe("uploadFile", () => {
    it("uploads a file and returns the key", async () => {
      mockSend.mockResolvedValue({});

      const result = await uploadFile(
        mockClient,
        "test-bucket",
        "test-key.pdf",
        Buffer.from("test content"),
        "application/pdf",
      );

      expect(result).toBe("test-key.pdf");
      expect(mockSend).toHaveBeenCalledTimes(1);

      const command = mockSend.mock.calls[0][0];
      expect(command.Bucket).toBe("test-bucket");
      expect(command.Key).toBe("test-key.pdf");
      expect(command.ContentType).toBe("application/pdf");
    });

    it("throws if upload fails", async () => {
      mockSend.mockRejectedValue(new Error("Upload failed"));

      await expect(
        uploadFile(
          mockClient,
          "test-bucket",
          "test-key.pdf",
          Buffer.from("test content"),
          "application/pdf",
        ),
      ).rejects.toThrow("Upload failed");
    });
  });

  describe("getFile", () => {
    it("retrieves a file and returns buffer", async () => {
      const mockBody = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from("chunk1");
          yield Buffer.from("chunk2");
        },
      };

      mockSend.mockResolvedValue({ Body: mockBody });

      const result = await getFile(mockClient, "test-bucket", "test-key.pdf");

      expect(result.toString()).toBe("chunk1chunk2");
      expect(mockSend).toHaveBeenCalledTimes(1);

      const command = mockSend.mock.calls[0][0];
      expect(command.Bucket).toBe("test-bucket");
      expect(command.Key).toBe("test-key.pdf");
    });

    it("throws if no body returned", async () => {
      mockSend.mockResolvedValue({ Body: null });

      await expect(
        getFile(mockClient, "test-bucket", "test-key.pdf"),
      ).rejects.toThrow("No body returned for key: test-key.pdf");
    });

    it("throws if get fails", async () => {
      mockSend.mockRejectedValue(new Error("Access denied"));

      await expect(
        getFile(mockClient, "test-bucket", "test-key.pdf"),
      ).rejects.toThrow("Access denied");
    });
  });

  describe("getSignedUploadUrl", () => {
    it("generates a presigned URL", async () => {
      const { getSignedUrl } = jest.requireMock(
        "@aws-sdk/s3-request-presigner",
      );

      const result = await getSignedUploadUrl(
        mockClient,
        "test-bucket",
        "test-key.pdf",
        "application/pdf",
      );

      expect(result).toBe("https://presigned-url.example.com");
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });

    it("uses custom expiration time", async () => {
      const { getSignedUrl } = jest.requireMock(
        "@aws-sdk/s3-request-presigner",
      );

      await getSignedUploadUrl(
        mockClient,
        "test-bucket",
        "test-key.pdf",
        "application/pdf",
        7200,
      );

      expect(getSignedUrl).toHaveBeenCalledWith(mockClient, expect.anything(), {
        expiresIn: 7200,
      });
    });
  });

  describe("ensureBucket", () => {
    it("returns true if bucket already exists", async () => {
      mockSend.mockResolvedValue({});

      const result = await ensureBucket(mockClient, "existing-bucket");

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend.mock.calls[0][0]._type).toBe("HeadBucketCommand");
    });

    it("creates bucket if it does not exist", async () => {
      const notFoundError = new Error("Not Found");
      notFoundError.name = "NotFound";
      mockSend.mockRejectedValueOnce(notFoundError).mockResolvedValueOnce({});

      const result = await ensureBucket(mockClient, "new-bucket");

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[0][0]._type).toBe("HeadBucketCommand");
      expect(mockSend.mock.calls[1][0]._type).toBe("CreateBucketCommand");
    });

    it("handles NoSuchBucket error", async () => {
      const noSuchBucketError = new Error("No such bucket");
      noSuchBucketError.name = "NoSuchBucket";
      mockSend
        .mockRejectedValueOnce(noSuchBucketError)
        .mockResolvedValueOnce({});

      const result = await ensureBucket(mockClient, "new-bucket");

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("returns true if bucket was already created by another process", async () => {
      const notFoundError = new Error("Not Found");
      notFoundError.name = "NotFound";
      const alreadyOwnedError = new Error("Bucket already owned");
      alreadyOwnedError.name = "BucketAlreadyOwnedByYou";
      mockSend
        .mockRejectedValueOnce(notFoundError)
        .mockRejectedValueOnce(alreadyOwnedError);

      const result = await ensureBucket(mockClient, "concurrent-bucket");

      expect(result).toBe(true);
    });

    it("returns false if bucket creation fails", async () => {
      const notFoundError = new Error("Not Found");
      notFoundError.name = "NotFound";
      const accessDeniedError = new Error("Access Denied");
      accessDeniedError.name = "AccessDenied";
      mockSend
        .mockRejectedValueOnce(notFoundError)
        .mockRejectedValueOnce(accessDeniedError);

      const result = await ensureBucket(mockClient, "forbidden-bucket");

      expect(result).toBe(false);
    });

    it("returns false if head bucket fails with unexpected error", async () => {
      const unexpectedError = new Error("Network error");
      unexpectedError.name = "NetworkingError";
      mockSend.mockRejectedValue(unexpectedError);

      const result = await ensureBucket(mockClient, "problem-bucket");

      expect(result).toBe(false);
    });
  });
});
