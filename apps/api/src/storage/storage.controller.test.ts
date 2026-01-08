import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { Request } from "express";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";

// Set up mocks
const mockUploadFile = jest.fn();
const mockExtractContextInfo = jest.fn();

jest.mock("@tambo-ai-cloud/backend", () => ({
  // Always return true so s3Client is created
  isS3Configured: jest.fn().mockReturnValue(true),
  createS3Client: jest.fn().mockReturnValue({ mockS3Client: true }),
  uploadFile: mockUploadFile,
}));

jest.mock("../common/utils/extract-context-info", () => ({
  extractContextInfo: mockExtractContextInfo,
}));

import { StorageController } from "./storage.controller";

describe("StorageController", () => {
  let controller: StorageController;
  let mockRequest: Partial<Request>;

  const createMockFile = (
    originalname: string,
    mimetype: string,
    size: number,
  ): Express.Multer.File => ({
    fieldname: "file",
    originalname,
    encoding: "7bit",
    mimetype,
    size,
    buffer: Buffer.from("test content"),
    destination: "",
    filename: "",
    path: "",
    stream: null as never,
  });

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
      projectId: "proj_123",
      contextKey: undefined,
    });

    mockRequest = {
      url: "/storage/upload",
    };
  });

  describe("upload", () => {
    it("throws BadRequestException when no file is provided", async () => {
      await expect(
        controller.upload(undefined as never, mockRequest as Request),
      ).rejects.toThrow(BadRequestException);
    });

    it("uploads file and returns attachment URI", async () => {
      mockUploadFile.mockResolvedValue("proj_123/1704567890-test.pdf");

      const file = createMockFile("test.pdf", "application/pdf", 1024);

      const result = await controller.upload(file, mockRequest as Request);

      expect(result.attachmentUri).toMatch(
        /^attachment:\/\/proj_123\/\d+-test\.pdf$/,
      );
      expect(mockUploadFile).toHaveBeenCalled();
    });

    it("sanitizes filename in the URI", async () => {
      mockUploadFile.mockResolvedValue("proj_123/1704567890-test_file.pdf");

      const file = createMockFile(
        "test file with spaces & special!chars.pdf",
        "application/pdf",
        1024,
      );

      const result = await controller.upload(file, mockRequest as Request);

      // Filename should be sanitized
      expect(result.attachmentUri).toMatch(
        /^attachment:\/\/proj_123\/\d+-test_file_with_spaces___special_chars\.pdf$/,
      );
    });

    it("includes projectId in the storage path", async () => {
      mockUploadFile.mockImplementation(async (_client, _bucket, key) => key);

      mockExtractContextInfo.mockReturnValue({
        projectId: "proj_custom",
        contextKey: undefined,
      });

      const file = createMockFile("doc.pdf", "application/pdf", 1024);

      const result = await controller.upload(file, mockRequest as Request);

      expect(result.attachmentUri).toContain("proj_custom/");
    });

    it("handles various MIME types correctly", async () => {
      mockUploadFile.mockResolvedValue("proj_123/1704567890-image.png");

      const file = createMockFile("image.png", "image/png", 2048);
      const result = await controller.upload(file, mockRequest as Request);

      expect(result.attachmentUri).toMatch(
        /^attachment:\/\/proj_123\/\d+-image\.png$/,
      );
      expect(mockUploadFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        expect.stringContaining("image.png"),
        expect.any(Buffer),
        "image/png",
      );
    });

    it("preserves allowed characters in filename (dots, hyphens, underscores)", async () => {
      mockUploadFile.mockResolvedValue(
        "proj_123/1704567890-my-file_v1.2.3.tar.gz",
      );

      const file = createMockFile(
        "my-file_v1.2.3.tar.gz",
        "application/gzip",
        4096,
      );
      const result = await controller.upload(file, mockRequest as Request);

      expect(result.attachmentUri).toMatch(
        /^attachment:\/\/proj_123\/\d+-my-file_v1\.2\.3\.tar\.gz$/,
      );
    });

    it("sanitizes Unicode characters in filename", async () => {
      mockUploadFile.mockResolvedValue("proj_123/1704567890-document.pdf");

      const file = createMockFile("документ.pdf", "application/pdf", 1024);
      const result = await controller.upload(file, mockRequest as Request);

      // Unicode characters should be replaced with underscores
      expect(result.attachmentUri).toMatch(
        /^attachment:\/\/proj_123\/\d+-_+\.pdf$/,
      );
    });

    it("propagates upload errors", async () => {
      mockUploadFile.mockRejectedValue(new Error("S3 upload failed"));

      const file = createMockFile("test.pdf", "application/pdf", 1024);

      await expect(
        controller.upload(file, mockRequest as Request),
      ).rejects.toThrow("S3 upload failed");
    });
  });
});

// Separate test suite for S3 not configured scenario
describe("StorageController - S3 not configured", () => {
  it("throws BadRequestException when S3 is not configured", async () => {
    // This test uses isolated modules to ensure fresh mock state
    jest.isolateModules(async () => {
      jest.doMock("@tambo-ai-cloud/backend", () => ({
        isS3Configured: jest.fn().mockReturnValue(false),
        createS3Client: jest.fn(),
        uploadFile: jest.fn(),
      }));

      jest.doMock("../common/utils/extract-context-info", () => ({
        extractContextInfo: jest.fn().mockReturnValue({
          projectId: "proj_123",
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

      const file: Express.Multer.File = {
        fieldname: "file",
        originalname: "test.pdf",
        encoding: "7bit",
        mimetype: "application/pdf",
        size: 1024,
        buffer: Buffer.from("test content"),
        destination: "",
        filename: "",
        path: "",
        stream: null as never,
      };

      await expect(
        unconfiguredController.upload(file, {
          url: "/storage/upload",
        } as Request),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
