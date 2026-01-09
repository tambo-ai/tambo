import {
  BadGatewayException,
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
import {
  buildAttachmentUri,
  buildStorageKey,
  ATTACHMENT_ID_LENGTH,
} from "@tambo-ai-cloud/core";
import { customAlphabet } from "nanoid";
import { Request } from "express";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";
import { extractContextInfo } from "../common/utils/extract-context-info";
import { PresignUploadDto, PresignUploadResponseDto } from "./dto/presign.dto";

const PRESIGN_EXPIRY_SECONDS = 3600;

/**
 * Regex pattern for validating MIME content types.
 * Follows RFC 6838 media type syntax (more permissive than strict RFC but safe).
 * Examples: "application/pdf", "image/png", "text/plain; charset=utf-8"
 */
const CONTENT_TYPE_REGEX =
  /^[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]*(?:;\s*\S+=\S+)*$/;

/**
 * Generate a short, URL-safe unique ID using base62 encoding.
 * Uses nanoid's customAlphabet which handles rejection sampling internally
 * to avoid modulo bias.
 */
const generateUniqueId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  ATTACHMENT_ID_LENGTH,
);

@ApiTags("storage")
@ApiSecurity("apiKey")
@ApiSecurity("bearer")
@UseGuards(ApiKeyGuard, BearerTokenGuard)
@Controller("storage")
export class StorageController {
  private readonly s3Client: S3Client | undefined;
  private readonly bucket: string;
  private readonly signingSecret: string;

  constructor(private readonly configService: ConfigService) {
    const config = {
      endpoint: this.configService.get<string>("S3_ENDPOINT") ?? "",
      region: this.configService.get<string>("S3_REGION") ?? "us-east-1",
      accessKeyId: this.configService.get<string>("S3_ACCESS_KEY_ID") ?? "",
      secretAccessKey:
        this.configService.get<string>("S3_SECRET_ACCESS_KEY") ?? "",
    };
    this.bucket = this.configService.get<string>("S3_BUCKET") ?? "user-files";
    this.signingSecret = this.configService.get<string>("API_KEY_SECRET") ?? "";

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
    description:
      "Invalid request (missing contentType or size, or size exceeds 10MB)",
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

    if (!this.signingSecret) {
      throw new ServiceUnavailableException(
        "Storage signing is not configured. API_KEY_SECRET is required.",
      );
    }

    const { projectId } = extractContextInfo(request, undefined);

    // Validate contentType to prevent weird values being signed
    if (!CONTENT_TYPE_REGEX.test(dto.contentType)) {
      throw new BadRequestException("Invalid contentType format");
    }

    // Generate a short unique ID and build the signed storage key
    // Key format is deterministic: {projectId}/{uniqueId}-{signature}
    // Max ~70 chars, well under S3's 1024 byte limit
    const uniqueId = generateUniqueId();
    const storageKey = buildStorageKey(projectId, uniqueId, this.signingSecret);

    try {
      const uploadUrl = await getSignedUploadUrl(
        this.s3Client,
        this.bucket,
        storageKey,
        dto.contentType,
        PRESIGN_EXPIRY_SECONDS,
      );

      return {
        uploadUrl,
        attachmentUri: buildAttachmentUri(projectId, uniqueId),
        expiresIn: PRESIGN_EXPIRY_SECONDS,
      };
    } catch {
      throw new BadGatewayException("Failed to create upload URL");
    }
  }
}
