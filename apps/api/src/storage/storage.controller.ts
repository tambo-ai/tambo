import {
  BadRequestException,
  BadGatewayException,
  Controller,
  Post,
  Req,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { S3Client } from "@aws-sdk/client-s3";
import { memoryStorage } from "multer";
import {
  createS3Client,
  isS3Configured,
  uploadFile,
} from "@tambo-ai-cloud/backend";
import { randomUUID } from "crypto";
import { Request } from "express";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";
import { extractContextInfo } from "../common/utils/extract-context-info";
import { UploadResponseDto } from "./dto/upload.dto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILENAME_LENGTH = 180;

const PROJECT_ID_REGEX = /^p_?[a-zA-Z0-9]{8,32}\.[0-9a-f]{6}$/;

function assertValidProjectId(projectId: string): void {
  if (!PROJECT_ID_REGEX.test(projectId)) {
    throw new BadRequestException("Invalid project id");
  }
}

/**
 * Sanitize a filename by removing potentially dangerous characters.
 * Preserves alphanumeric characters, dots, hyphens, and underscores.
 */
function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^[_.]+/, "")
    .replace(/_+/g, "_");

  return sanitized.slice(0, MAX_FILENAME_LENGTH) || "file";
}

@ApiTags("storage")
@ApiSecurity("apiKey")
@ApiSecurity("bearer")
@UseGuards(ApiKeyGuard, BearerTokenGuard)
@Controller("storage")
export class StorageController {
  private readonly s3Client: S3Client | undefined;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const config = {
      endpoint: this.configService.get<string>("S3_ENDPOINT") ?? "",
      region: this.configService.get<string>("S3_REGION") ?? "us-east-1",
      accessKeyId: this.configService.get<string>("S3_ACCESS_KEY_ID") ?? "",
      secretAccessKey:
        this.configService.get<string>("S3_SECRET_ACCESS_KEY") ?? "",
    };
    this.bucket = this.configService.get<string>("S3_BUCKET") ?? "user-files";

    if (isS3Configured(config)) {
      this.s3Client = createS3Client(config);
    }
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_FILE_SIZE },
      storage: memoryStorage(),
    }),
  )
  @ApiOperation({ summary: "Upload a file attachment" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "File uploaded successfully",
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Storage not configured or invalid file",
  })
  @ApiResponse({
    status: 502,
    description: "Failed to upload file to storage",
  })
  @ApiResponse({
    status: 503,
    description: "Storage is not configured",
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ): Promise<UploadResponseDto> {
    if (!this.s3Client) {
      throw new ServiceUnavailableException(
        "Storage is not configured. S3 credentials are required.",
      );
    }

    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const { projectId } = extractContextInfo(request, undefined);
    assertValidProjectId(projectId);

    const key = `${projectId}/${Date.now()}-${randomUUID()}-${sanitizeFilename(file.originalname)}`;
    try {
      await uploadFile(
        this.s3Client,
        this.bucket,
        key,
        file.buffer,
        file.mimetype,
      );
    } catch {
      throw new BadGatewayException("Failed to upload file to storage");
    }

    return { attachmentUri: `attachment://${key}` };
  }
}
