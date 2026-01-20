import { S3Client } from "@aws-sdk/client-s3";
import { ensureBucket, getFile, getSignedUploadUrl } from "./operations";

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

  describe("getFile", () => {
    it("retrieves a file and returns buffer with contentType", async () => {
      const mockBody = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from("chunk1");
          yield Buffer.from("chunk2");
        },
      };

      mockSend.mockResolvedValue({
        Body: mockBody,
        ContentType: "application/pdf",
      });

      const result = await getFile(mockClient, "test-bucket", "test-key.pdf");

      expect(result.buffer.toString()).toBe("chunk1chunk2");
      expect(result.contentType).toBe("application/pdf");
      expect(mockSend).toHaveBeenCalledTimes(1);

      const command = mockSend.mock.calls[0][0];
      expect(command.Bucket).toBe("test-bucket");
      expect(command.Key).toBe("test-key.pdf");
    });

    it("returns default contentType when not provided by S3", async () => {
      const mockBody = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from("data");
        },
      };

      mockSend.mockResolvedValue({ Body: mockBody });

      const result = await getFile(mockClient, "test-bucket", "test-key");

      expect(result.contentType).toBe("application/octet-stream");
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

    it("throws if ContentLength exceeds max size", async () => {
      const mockBody = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from("chunk");
        },
      };

      mockSend.mockResolvedValue({
        Body: mockBody,
        ContentLength: 10 * 1024 * 1024 + 1,
      });

      await expect(
        getFile(mockClient, "test-bucket", "too-big.bin"),
      ).rejects.toThrow("Attachment too large");
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

      await expect(ensureBucket(mockClient, "existing-bucket")).resolves.toBe(
        undefined,
      );
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend.mock.calls[0][0]._type).toBe("HeadBucketCommand");
    });

    it("creates bucket if it does not exist", async () => {
      const notFoundError = new Error("Not Found");
      notFoundError.name = "NotFound";
      mockSend.mockRejectedValueOnce(notFoundError).mockResolvedValueOnce({});

      await expect(ensureBucket(mockClient, "new-bucket")).resolves.toBe(
        undefined,
      );
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

      await expect(ensureBucket(mockClient, "new-bucket")).resolves.toBe(
        undefined,
      );
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

      await expect(ensureBucket(mockClient, "concurrent-bucket")).resolves.toBe(
        undefined,
      );
    });

    it("throws if bucket creation fails", async () => {
      const notFoundError = new Error("Not Found");
      notFoundError.name = "NotFound";
      const accessDeniedError = new Error("Access Denied");
      accessDeniedError.name = "AccessDenied";
      mockSend
        .mockRejectedValueOnce(notFoundError)
        .mockRejectedValueOnce(accessDeniedError);

      await expect(
        ensureBucket(mockClient, "forbidden-bucket"),
      ).rejects.toThrow("Access Denied");
    });

    it("throws if head bucket fails with unexpected error", async () => {
      const unexpectedError = new Error("Network error");
      unexpectedError.name = "NetworkingError";
      mockSend.mockRejectedValue(unexpectedError);

      await expect(ensureBucket(mockClient, "problem-bucket")).rejects.toThrow(
        "Network error",
      );
    });

    it("detects missing bucket by httpStatusCode", async () => {
      const missingError = Object.assign(new Error("Not Found"), {
        $metadata: { httpStatusCode: 404 },
      });

      mockSend.mockRejectedValueOnce(missingError).mockResolvedValueOnce({});

      await expect(ensureBucket(mockClient, "new-bucket")).resolves.toBe(
        undefined,
      );
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[1][0]._type).toBe("CreateBucketCommand");
    });
  });
});
