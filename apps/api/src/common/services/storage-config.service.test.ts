import { S3Client } from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import * as backend from "@tambo-ai-cloud/backend";
import { StorageConfigService } from "./storage-config.service";

jest.mock("@tambo-ai-cloud/backend");

describe("StorageConfigService", () => {
  let isS3ConfiguredMock: jest.SpyInstance;
  let createS3ClientMock: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    isS3ConfiguredMock = jest
      .spyOn(backend, "isS3Configured")
      .mockReturnValue(false);
    createS3ClientMock = jest
      .spyOn(backend, "createS3Client")
      .mockReturnValue({} as S3Client);
  });

  async function createService(
    configValues: Record<string, string | undefined>,
  ): Promise<StorageConfigService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockImplementation((key: string) => configValues[key]),
          },
        },
      ],
    }).compile();

    return module.get<StorageConfigService>(StorageConfigService);
  }

  describe("bucket property", () => {
    it("should trim whitespace from S3_BUCKET", async () => {
      const service = await createService({ S3_BUCKET: "  my-bucket  " });
      expect(service.bucket).toBe("my-bucket");
    });

    it("should be empty string when S3_BUCKET is whitespace only and hasStorageConfig returns false", async () => {
      const service = await createService({ S3_BUCKET: "   " });
      expect(service.bucket).toBe("");
      expect(service.hasStorageConfig()).toBe(false);
    });

    it("should be empty string when S3_BUCKET is empty string and hasStorageConfig returns false", async () => {
      const service = await createService({ S3_BUCKET: "" });
      expect(service.bucket).toBe("");
      expect(service.hasStorageConfig()).toBe(false);
    });

    it("should be empty string when S3_BUCKET is undefined and hasStorageConfig returns false", async () => {
      const service = await createService({});
      expect(service.bucket).toBe("");
      expect(service.hasStorageConfig()).toBe(false);
    });
  });

  describe("signingSecret property", () => {
    it("should trim whitespace from API_KEY_SECRET", async () => {
      const service = await createService({ API_KEY_SECRET: "  secret  " });
      expect(service.signingSecret).toBe("secret");
    });

    it("should be empty string when API_KEY_SECRET is whitespace only and hasStorageConfig returns false", async () => {
      const service = await createService({ API_KEY_SECRET: "   " });
      expect(service.signingSecret).toBe("");
      expect(service.hasStorageConfig()).toBe(false);
    });
  });

  describe("s3Client configuration", () => {
    it("should create s3Client and hasStorageConfig true when fully configured", async () => {
      const mockS3Client = { custom: "client" } as any;
      createS3ClientMock.mockReturnValue(mockS3Client);
      isS3ConfiguredMock.mockReturnValue(true);

      const service = await createService({
        S3_ENDPOINT: "https://s3.example.com",
        S3_REGION: "us-west-2",
        S3_ACCESS_KEY_ID: "test-key-id",
        S3_SECRET_ACCESS_KEY: "test-secret-key",
        S3_BUCKET: "test-bucket",
        API_KEY_SECRET: "test-secret",
      });

      expect(service.s3Client).toBe(mockS3Client);
      expect(service.hasStorageConfig()).toBe(true);
      expect(createS3ClientMock).toHaveBeenCalledWith({
        endpoint: "https://s3.example.com",
        region: "us-west-2",
        accessKeyId: "test-key-id",
        secretAccessKey: "test-secret-key",
      });
    });

    it("should have undefined s3Client and hasStorageConfig false when S3 is not configured", async () => {
      isS3ConfiguredMock.mockReturnValue(false);

      const service = await createService({
        S3_ENDPOINT: "https://s3.example.com",
      });

      expect(service.s3Client).toBeUndefined();
      expect(service.hasStorageConfig()).toBe(false);
      expect(createS3ClientMock).not.toHaveBeenCalled();
    });
  });
});
