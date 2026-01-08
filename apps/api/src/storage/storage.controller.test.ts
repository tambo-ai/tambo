import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { Request } from "express";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";

const mockGetSignedUploadUrl = jest.fn();
const mockExtractContextInfo = jest.fn();

jest.mock("@tambo-ai-cloud/backend", () => ({
  isS3Configured: jest.fn().mockReturnValue(true),
  createS3Client: jest.fn().mockReturnValue({ mockS3Client: true }),
  getSignedUploadUrl: mockGetSignedUploadUrl,
}));

jest.mock("../common/utils/extract-context-info", () => ({
  extractContextInfo: mockExtractContextInfo,
}));

import { StorageController } from "./storage.controller";
import { PresignUploadDto } from "./dto/presign.dto";

describe("StorageController", () => {
  let controller: StorageController;
  let mockRequest: Partial<Request>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                S3_ENDPOINT: "https://s3.example.com",
                S3_REGION: "us-east-1",
                S3_ACCESS_KEY_ID: "test-key",
                S3_SECRET_ACCESS_KEY: "test-secret",
                S3_BUCKET: "test-bucket",
              };
              return config[key];
            }),
          },
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
    it("returns presigned URL and attachment URI", async () => {
      const dto: PresignUploadDto = {
        filename: "test.pdf",
        contentType: "application/pdf",
      };

      const result = await controller.presign(dto, mockRequest as Request);

      expect(result.uploadUrl).toBe(
        "https://s3.example.com/test-bucket/key?X-Amz-Signature=abc123",
      );
      expect(result.attachmentUri).toMatch(
        /^attachment:\/\/p_u2tgQg5U\.43bbdf\/\d+-[0-9a-f-]{36}-test\.pdf$/,
      );
      expect(result.expiresIn).toBe(3600);
    });

    it("calls getSignedUploadUrl with correct parameters", async () => {
      const dto: PresignUploadDto = {
        filename: "document.pdf",
        contentType: "application/pdf",
      };

      await controller.presign(dto, mockRequest as Request);

      expect(mockGetSignedUploadUrl).toHaveBeenCalledWith(
        expect.anything(), // s3Client
        "test-bucket",
        expect.stringMatching(
          /^p_u2tgQg5U\.43bbdf\/\d+-[0-9a-f-]{36}-document\.pdf$/,
        ),
        "application/pdf",
        3600,
      );
    });

    it("sanitizes filename in the key", async () => {
      const dto: PresignUploadDto = {
        filename: "test file with spaces & special!chars.pdf",
        contentType: "application/pdf",
      };

      const result = await controller.presign(dto, mockRequest as Request);

      expect(result.attachmentUri).toMatch(
        /^attachment:\/\/p_u2tgQg5U\.43bbdf\/\d+-[0-9a-f-]{36}-test_file_with_spaces_special_chars\.pdf$/,
      );
    });

    it("includes projectId in the storage path", async () => {
      mockExtractContextInfo.mockReturnValue({
        projectId: "p_abcdEF12.43bbdf",
        contextKey: undefined,
      });

      const dto: PresignUploadDto = {
        filename: "doc.pdf",
        contentType: "application/pdf",
      };

      const result = await controller.presign(dto, mockRequest as Request);

      expect(result.attachmentUri).toContain("p_abcdEF12.43bbdf/");
    });

    it("preserves allowed characters in filename", async () => {
      const dto: PresignUploadDto = {
        filename: "my-file_v1.2.3.tar.gz",
        contentType: "application/gzip",
      };

      const result = await controller.presign(dto, mockRequest as Request);

      expect(result.attachmentUri).toMatch(
        /^attachment:\/\/p_u2tgQg5U\.43bbdf\/\d+-[0-9a-f-]{36}-my-file_v1\.2\.3\.tar\.gz$/,
      );
    });

    it("sanitizes Unicode characters in filename", async () => {
      const dto: PresignUploadDto = {
        filename: "документ.pdf",
        contentType: "application/pdf",
      };

      const result = await controller.presign(dto, mockRequest as Request);

      expect(result.attachmentUri).toMatch(
        /^attachment:\/\/p_u2tgQg5U\.43bbdf\/\d+-[0-9a-f-]{36}-file\.pdf$/,
      );
    });

    it("throws BadRequestException for invalid projectId", async () => {
      mockExtractContextInfo.mockReturnValue({
        projectId: "invalid project id with spaces",
        contextKey: undefined,
      });

      const dto: PresignUploadDto = {
        filename: "test.pdf",
        contentType: "application/pdf",
      };

      await expect(
        controller.presign(dto, mockRequest as Request),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

describe("StorageController - S3 not configured", () => {
  it("throws ServiceUnavailableException when S3 is not configured", async () => {
    jest.isolateModules(async () => {
      jest.doMock("@tambo-ai-cloud/backend", () => ({
        isS3Configured: jest.fn().mockReturnValue(false),
        createS3Client: jest.fn(),
        getSignedUploadUrl: jest.fn(),
      }));

      jest.doMock("../common/utils/extract-context-info", () => ({
        extractContextInfo: jest.fn().mockReturnValue({
          projectId: "p_u2tgQg5U.43bbdf",
          contextKey: undefined,
        }),
      }));

      const { StorageController: IsolatedController } =
        await import("./storage.controller");

      const module: TestingModule = await Test.createTestingModule({
        controllers: [IsolatedController],
        providers: [
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(""),
            },
          },
        ],
      })
        .overrideGuard(ApiKeyGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(BearerTokenGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const unconfiguredController =
        module.get<InstanceType<typeof IsolatedController>>(IsolatedController);

      const dto = {
        filename: "test.pdf",
        contentType: "application/pdf",
      };

      await expect(
        unconfiguredController.presign(dto, {
          url: "/storage/presign",
        } as Request),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
