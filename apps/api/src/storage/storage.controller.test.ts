import {
  BadGatewayException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Request } from "express";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";

const mockGetSignedUploadUrl = jest.fn();
const mockExtractContextInfo = jest.fn();

jest.mock("@tambo-ai-cloud/backend", () => ({
  getSignedUploadUrl: mockGetSignedUploadUrl,
}));

jest.mock("../common/utils/extract-context-info", () => ({
  extractContextInfo: mockExtractContextInfo,
}));

import { StorageController } from "./storage.controller";
import { PresignUploadDto } from "./dto/presign.dto";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { StorageConfigService } from "../common/services/storage-config.service";

describe("StorageController", () => {
  let controller: StorageController;
  let mockRequest: Partial<Request>;
  let mockLogger: jest.Mocked<CorrelationLoggerService>;
  let mockStorageConfig: jest.Mocked<StorageConfigService>;

  beforeAll(async () => {
    mockLogger = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<CorrelationLoggerService>;

    mockStorageConfig = {
      s3Client: { mockS3Client: true },
      bucket: "test-bucket",
      signingSecret: "test-signing-secret",
      isConfigured: true,
    } as unknown as jest.Mocked<StorageConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageConfigService,
          useValue: mockStorageConfig,
        },
        {
          provide: CorrelationLoggerService,
          useValue: mockLogger,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BearerTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StorageController>(StorageController);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockExtractContextInfo.mockReturnValue({
      projectId: "p_u2tgQg5U.43bbdf",
      contextKey: undefined,
    });

    mockGetSignedUploadUrl.mockResolvedValue(
      "https://s3.example.com/test-bucket/key?X-Amz-Signature=abc123",
    );

    mockRequest = {
      url: "/storage/presign",
    };
  });

  describe("presign", () => {
    it("returns presigned URL and attachment URI with short unique ID", async () => {
      const dto: PresignUploadDto = {
        contentType: "application/pdf",
        size: 1024,
      };

      const result = await controller.presign(dto, mockRequest as Request);

      expect(result.uploadUrl).toBe(
        "https://s3.example.com/test-bucket/key?X-Amz-Signature=abc123",
      );
      // URI format: attachment://{projectId}/{uniqueId} (10 char base62 ID)
      expect(result.attachmentUri).toMatch(
        /^attachment:\/\/p_u2tgQg5U\.43bbdf\/[A-Za-z0-9]{10}$/,
      );
      expect(result.expiresIn).toBe(3600);
    });

    it("calls getSignedUploadUrl with storage key including signature", async () => {
      const dto: PresignUploadDto = {
        contentType: "application/pdf",
        size: 2048,
      };

      await controller.presign(dto, mockRequest as Request);

      expect(mockGetSignedUploadUrl).toHaveBeenCalledWith(
        expect.anything(), // s3Client
        "test-bucket",
        // Storage key format: {projectId}/{uniqueId}-{signature}
        expect.stringMatching(
          /^p_u2tgQg5U\.43bbdf\/[A-Za-z0-9]{10}-[a-f0-9]{8}$/,
        ),
        "application/pdf",
        3600,
      );
    });

    it("includes projectId in the storage path", async () => {
      mockExtractContextInfo.mockReturnValue({
        projectId: "p_abcdEF12.43bbdf",
        contextKey: undefined,
      });

      const dto: PresignUploadDto = {
        contentType: "application/pdf",
        size: 1024,
      };

      const result = await controller.presign(dto, mockRequest as Request);

      expect(result.attachmentUri).toContain("p_abcdEF12.43bbdf/");
    });

    it("generates unique IDs for each request", async () => {
      const dto: PresignUploadDto = {
        contentType: "application/pdf",
        size: 1024,
      };

      const result1 = await controller.presign(dto, mockRequest as Request);
      const result2 = await controller.presign(dto, mockRequest as Request);

      // Extract unique IDs from URIs
      const id1 = result1.attachmentUri.split("/").pop();
      const id2 = result2.attachmentUri.split("/").pop();

      expect(id1).not.toBe(id2);
    });

    it("handles different content types", async () => {
      const dto: PresignUploadDto = {
        contentType: "image/png",
        size: 512,
      };

      await controller.presign(dto, mockRequest as Request);

      expect(mockGetSignedUploadUrl).toHaveBeenCalledWith(
        expect.anything(),
        "test-bucket",
        expect.any(String),
        "image/png",
        3600,
      );
    });

    it("throws BadGatewayException when S3 upload fails", async () => {
      mockGetSignedUploadUrl.mockRejectedValue(new Error("S3 error"));

      const dto: PresignUploadDto = {
        contentType: "application/pdf",
        size: 1024,
      };

      await expect(
        controller.presign(dto, mockRequest as Request),
      ).rejects.toThrow(BadGatewayException);
    });

    it("logs error when presigned URL generation fails", async () => {
      mockGetSignedUploadUrl.mockRejectedValue(new Error("S3 error"));

      const dto: PresignUploadDto = {
        contentType: "application/pdf",
        size: 1024,
      };

      await expect(
        controller.presign(dto, mockRequest as Request),
      ).rejects.toThrow(BadGatewayException);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to generate presigned URL"),
        expect.stringContaining("S3 error"),
      );
    });
  });
});

describe("StorageController - S3 not configured", () => {
  it("throws ServiceUnavailableException when S3 is not configured", async () => {
    const unconfiguredStorageConfig = {
      s3Client: undefined,
      bucket: "test-bucket",
      signingSecret: "test-signing-secret",
      isConfigured: false,
    } as unknown as StorageConfigService;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageConfigService,
          useValue: unconfiguredStorageConfig,
        },
        {
          provide: CorrelationLoggerService,
          useValue: { error: jest.fn(), log: jest.fn() },
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BearerTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const unconfiguredController =
      module.get<StorageController>(StorageController);

    const dto: PresignUploadDto = {
      contentType: "application/pdf",
      size: 1024,
    };

    await expect(
      unconfiguredController.presign(dto, {
        url: "/storage/presign",
      } as Request),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it("throws ServiceUnavailableException when API_KEY_SECRET is missing", async () => {
    const noSecretStorageConfig = {
      s3Client: { mockS3Client: true },
      bucket: "test-bucket",
      signingSecret: "", // Empty!
      isConfigured: true,
    } as unknown as StorageConfigService;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageConfigService,
          useValue: noSecretStorageConfig,
        },
        {
          provide: CorrelationLoggerService,
          useValue: { error: jest.fn(), log: jest.fn() },
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BearerTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const controllerWithoutSecret =
      module.get<StorageController>(StorageController);

    mockExtractContextInfo.mockReturnValue({
      projectId: "p_u2tgQg5U.43bbdf",
      contextKey: undefined,
    });

    const dto: PresignUploadDto = {
      contentType: "application/pdf",
      size: 1024,
    };

    await expect(
      controllerWithoutSecret.presign(dto, {
        url: "/storage/presign",
      } as Request),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
