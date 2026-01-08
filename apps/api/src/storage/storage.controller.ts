import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { S3Client } from "@aws-sdk/client-s3";
import {
  createS3Client,
  getSignedUploadUrl,
  isS3Configured,
} from "@tambo-ai-cloud/backend";
import { randomUUID } from "crypto";
import { extname } from "path";
import { Request } from "express";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";
import { extractContextInfo } from "../common/utils/extract-context-info";
import { PresignUploadDto, PresignUploadResponseDto } from "./dto/presign.dto";

const MAX_FILENAME_LENGTH = 180;
const PRESIGN_EXPIRY_SECONDS = 3600;

const PROJECT_ID_REGEX = /^[a-zA-Z0-9_.-]{4,128}$/;

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
  const extension = extname(filename);
  const baseName = extension ? filename.slice(0, -extension.length) : filename;

  const sanitizedBase = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/_+/g, "_");

  const trimmedBase = sanitizedBase.replace(/^[_.]+/, "");
  const trimmedExtension = extension.replace(/[^a-zA-Z0-9.]/g, "");

  const fullName = `${trimmedBase || "file"}${trimmedExtension}`;

  return fullName.slice(0, MAX_FILENAME_LENGTH) || "file";
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

  @Post("presign")
  @ApiOperation({
    summary: "Get a presigned URL for direct S3 upload",
    description:
      "Returns a presigned URL that allows direct file upload to S3. " +
      "The client should PUT the file directly to the returned uploadUrl.",
  })
  @ApiResponse({
    status: 201,
    description: "Presigned URL generated successfully",
    type: PresignUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request (missing filename or contentType)",
  })
  @ApiResponse({
    status: 503,
    description: "Storage is not configured",
  })
  async presign(
    @Body() dto: PresignUploadDto,
    @Req() request: Request,
  ): Promise<PresignUploadResponseDto> {
    if (!this.s3Client) {
      throw new ServiceUnavailableException(
        "Storage is not configured. S3 credentials are required.",
      );
    }

    const { projectId } = extractContextInfo(request, undefined);
    assertValidProjectId(projectId);

    const key = `${projectId}/${Date.now()}-${randomUUID()}-${sanitizeFilename(dto.filename)}`;

    const uploadUrl = await getSignedUploadUrl(
      this.s3Client,
      this.bucket,
      key,
      dto.contentType,
      PRESIGN_EXPIRY_SECONDS,
    );

    return {
      uploadUrl,
      attachmentUri: `attachment://${key}`,
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    };
  }
}
