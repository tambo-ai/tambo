import { isS3Configured, createS3Client, S3Config } from "./s3-client";

describe("s3-client", () => {
  describe("isS3Configured", () => {
    it("returns true when all required config values are present", () => {
      const config: S3Config = {
        endpoint: "https://s3.example.com",
        region: "us-east-1",
        accessKeyId: "test-key-id",
        secretAccessKey: "test-secret",
      };
      expect(isS3Configured(config)).toBe(true);
    });

    it("returns false when endpoint is missing", () => {
      const config = {
        region: "us-east-1",
        accessKeyId: "test-key-id",
        secretAccessKey: "test-secret",
      };
      expect(isS3Configured(config)).toBe(false);
    });

    it("returns false when region is missing", () => {
      const config = {
        endpoint: "https://s3.example.com",
        accessKeyId: "test-key-id",
        secretAccessKey: "test-secret",
      };
      expect(isS3Configured(config)).toBe(false);
    });

    it("returns false when accessKeyId is missing", () => {
      const config = {
        endpoint: "https://s3.example.com",
        region: "us-east-1",
        secretAccessKey: "test-secret",
      };
      expect(isS3Configured(config)).toBe(false);
    });

    it("returns false when secretAccessKey is missing", () => {
      const config = {
        endpoint: "https://s3.example.com",
        region: "us-east-1",
        accessKeyId: "test-key-id",
      };
      expect(isS3Configured(config)).toBe(false);
    });

    it("returns false when endpoint is empty string", () => {
      const config = {
        endpoint: "",
        region: "us-east-1",
        accessKeyId: "test-key-id",
        secretAccessKey: "test-secret",
      };
      expect(isS3Configured(config)).toBe(false);
    });

    it("returns false for empty config", () => {
      expect(isS3Configured({})).toBe(false);
    });
  });

  describe("createS3Client", () => {
    it("creates an S3Client with the provided config", () => {
      const config: S3Config = {
        endpoint: "https://s3.example.com",
        region: "us-east-1",
        accessKeyId: "test-key-id",
        secretAccessKey: "test-secret",
      };

      const client = createS3Client(config);
      expect(client).toBeDefined();
      // S3Client is created successfully - we can't easily inspect internal config
      // but the fact that it doesn't throw is a good sign
    });
  });
});
