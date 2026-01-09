import {
  BadGatewayException,
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
                API_KEY_SECRET: "test-signing-secret",
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
  });
});

describe("StorageController - S3 not configured", () => {
  it("throws ServiceUnavailableException when S3 is not configured", async () => {
    // Use a promise to properly await the isolateModules callback
    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(() => {
        void (async () => {
          try {
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
              module.get<InstanceType<typeof IsolatedController>>(
                IsolatedController,
              );

            const dto: PresignUploadDto = {
              contentType: "application/pdf",
              size: 1024,
            };

            await expect(
              unconfiguredController.presign(dto, {
                url: "/storage/presign",
              } as Request),
            ).rejects.toThrow(ServiceUnavailableException);

            resolve();
          } catch (error) {
            reject(error);
          }
        })();
      });
    });
  });

  it("throws ServiceUnavailableException when API_KEY_SECRET is missing", async () => {
    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(() => {
        void (async () => {
          try {
            jest.doMock("@tambo-ai-cloud/backend", () => ({
              isS3Configured: jest.fn().mockReturnValue(true),
              createS3Client: jest.fn().mockReturnValue({ mockS3Client: true }),
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
                    get: jest.fn((key: string) => {
                      // S3 configured but no API_KEY_SECRET
                      const config: Record<string, string> = {
                        S3_ENDPOINT: "https://s3.example.com",
                        S3_REGION: "us-east-1",
                        S3_ACCESS_KEY_ID: "test-key",
                        S3_SECRET_ACCESS_KEY: "test-secret",
                        S3_BUCKET: "test-bucket",
                        API_KEY_SECRET: "", // Empty!
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

            const controllerWithoutSecret =
              module.get<InstanceType<typeof IsolatedController>>(
                IsolatedController,
              );

            const dto: PresignUploadDto = {
              contentType: "application/pdf",
              size: 1024,
            };

            await expect(
              controllerWithoutSecret.presign(dto, {
                url: "/storage/presign",
              } as Request),
            ).rejects.toThrow(ServiceUnavailableException);

            resolve();
          } catch (error) {
            reject(error);
          }
        })();
      });
    });
  });
});
