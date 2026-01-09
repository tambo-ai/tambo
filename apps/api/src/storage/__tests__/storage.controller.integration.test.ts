import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { ApiKeyGuard } from "../../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../../projects/guards/bearer-token.guard";

// Setup mocks before importing the controller
const mockGetSignedUploadUrl = jest.fn();
const mockExtractContextInfo = jest.fn();

jest.mock("@tambo-ai-cloud/backend", () => ({
  getSignedUploadUrl: (...args: unknown[]) => mockGetSignedUploadUrl(...args),
}));

jest.mock("../../common/utils/extract-context-info", () => ({
  extractContextInfo: (...args: unknown[]) => mockExtractContextInfo(...args),
}));

// Import controller after mocks are set up
import { StorageController } from "../storage.controller";
import { CorrelationLoggerService } from "../../common/services/logger.service";
import { StorageConfigService } from "../../common/services/storage-config.service";

describe("StorageController (integration)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageConfigService,
          useValue: {
            s3Client: { mockS3Client: true },
            bucket: "test-bucket",
            signingSecret: "test-signing-secret",
            isConfigured: true,
          },
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
          contentType: "application/pdf",
          size: 1024,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        uploadUrl: expect.stringContaining("http://localhost:9000"),
        // URI format: attachment://{projectId}/{uniqueId} (10 char base62 ID)
        attachmentUri: expect.stringMatching(
          /^attachment:\/\/p_testProject123\/[A-Za-z0-9]{10}$/,
        ),
        expiresIn: 3600,
      });
    });

    it("returns URI with short unique ID", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          contentType: "application/pdf",
          size: 2048,
        })
        .expect(201);

      // URI contains just a short unique ID
      expect(response.body.attachmentUri).toMatch(
        /^attachment:\/\/p_testProject123\/[A-Za-z0-9]{10}$/,
      );
    });

    it("returns 400 when size is missing", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          contentType: "application/pdf",
        })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining("size")]),
      );
    });

    it("returns 400 when contentType is missing", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          size: 1024,
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

    it("returns 400 for size of 0", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          contentType: "application/pdf",
          size: 0,
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining("size")]),
      );
    });

    it("returns 400 for size exceeding 10MB", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          contentType: "application/pdf",
          size: 11 * 1024 * 1024, // 11MB
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining("size")]),
      );
    });

    it("accepts size at the 10MB limit", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          contentType: "application/pdf",
          size: 10 * 1024 * 1024, // exactly 10MB
        })
        .expect(201);

      expect(response.body.attachmentUri).toMatch(
        /^attachment:\/\/p_testProject123\/[A-Za-z0-9]{10}$/,
      );
    });

    it("includes correct content-type header", async () => {
      const response = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          contentType: "application/pdf",
          size: 1024,
        })
        .expect(201);

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    it("generates unique attachment URIs for each request", async () => {
      const response1 = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          contentType: "application/pdf",
          size: 1024,
        })
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          contentType: "application/pdf",
          size: 1024,
        })
        .expect(201);

      expect(response1.body.attachmentUri).not.toBe(
        response2.body.attachmentUri,
      );
    });

    it("handles different content types", async () => {
      const imageResponse = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          contentType: "image/png",
          size: 512,
        })
        .expect(201);

      expect(imageResponse.body.attachmentUri).toMatch(
        /^attachment:\/\/p_testProject123\/[A-Za-z0-9]{10}$/,
      );

      const jsonResponse = await request(app.getHttpServer())
        .post("/storage/presign")
        .send({
          contentType: "application/json",
          size: 256,
        })
        .expect(201);

      expect(jsonResponse.body.attachmentUri).toMatch(
        /^attachment:\/\/p_testProject123\/[A-Za-z0-9]{10}$/,
      );
    });
  });
});
