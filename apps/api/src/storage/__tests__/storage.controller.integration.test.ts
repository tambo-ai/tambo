import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { ConfigService } from "@nestjs/config";
import { ApiKeyGuard } from "../../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../../projects/guards/bearer-token.guard";

// Setup mocks before importing the controller
const mockGetSignedUploadUrl = jest.fn();
const mockExtractContextInfo = jest.fn();

jest.mock("@tambo-ai-cloud/backend", () => ({
  isS3Configured: () => true,
  createS3Client: () => ({ mockS3Client: true }),
  getSignedUploadUrl: (...args: unknown[]) => mockGetSignedUploadUrl(...args),
}));

jest.mock("../../common/utils/extract-context-info", () => ({
  extractContextInfo: (...args: unknown[]) => mockExtractContextInfo(...args),
}));

// Import controller after mocks are set up
import { StorageController } from "../storage.controller";

describe("StorageController (integration)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const config: Record<string, string> = {
                S3_ENDPOINT: "http://localhost:9000",
                S3_REGION: "us-east-1",
                S3_ACCESS_KEY_ID: "test-key",
                S3_SECRET_ACCESS_KEY: "test-secret",
                S3_BUCKET: "test-bucket",
              };
              return config[key];
            },
          },
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BearerTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockExtractContextInfo.mockReturnValue({
      projectId: "p_testProject123",
      contextKey: undefined,
    });
    mockGetSignedUploadUrl.mockResolvedValue(
      "http://localhost:9000/test-bucket/key?X-Amz-Signature=abc123",
    );
  });

  describe("POST /storage/presign", () => {
    it("returns 201 with presigned URL for valid request", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          filename: "document.pdf",
          contentType: "application/pdf",
        })
        .expect(201);

      expect(response.body).toMatchObject({
        uploadUrl: expect.stringContaining("http://localhost:9000"),
        attachmentUri: expect.stringMatching(
          /^attachment:\/\/p_testProject123\/\d+-[0-9a-f-]{36}-document\.pdf$/,
        ),
        expiresIn: 3600,
      });
    });

    it("sanitizes filename with special characters", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          filename: "my file (copy).pdf",
          contentType: "application/pdf",
        })
        .expect(201);

      // Spaces become underscores, parentheses become underscores, consecutive underscores collapse
      expect(response.body.attachmentUri).toMatch(
        /^attachment:\/\/p_testProject123\/\d+-[0-9a-f-]{36}-my_file_copy_\.pdf$/,
      );
    });

    it("returns 400 when filename is missing", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          contentType: "application/pdf",
        })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining("filename")]),
      );
    });

    it("returns 400 when contentType is missing", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          filename: "test.pdf",
        })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining("contentType")]),
      );
    });

    it("returns 400 when body is empty", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({})
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it("returns 400 for empty filename string", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          filename: "",
          contentType: "application/pdf",
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it("handles unicode filenames by sanitizing", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          filename: "文档.pdf",
          contentType: "application/pdf",
        })
        .expect(201);

      expect(response.body.attachmentUri).toMatch(/\.pdf$/);
      expect(response.body.attachmentUri).not.toContain("文档");
    });

    it("includes correct content-type header", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          filename: "test.pdf",
          contentType: "application/pdf",
        })
        .expect(201);

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });
  });
});
