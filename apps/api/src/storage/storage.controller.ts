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
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { getSignedUploadUrl } from "@tambo-ai-cloud/backend";
import {
  buildAttachmentUri,
  buildStorageKey,
  ATTACHMENT_ID_LENGTH,
} from "@tambo-ai-cloud/core";
import { customAlphabet } from "nanoid";
import { parse as parseContentType } from "content-type";
import { Request } from "express";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";
import { extractContextInfo } from "../common/utils/extract-context-info";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { StorageConfigService } from "../common/services/storage-config.service";
import { PresignUploadDto, PresignUploadResponseDto } from "./dto/presign.dto";

const PRESIGN_EXPIRY_SECONDS = 3600;

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
  constructor(
    private readonly storageConfig: StorageConfigService,
    private readonly logger: CorrelationLoggerService,
  ) {}

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
    if (!this.storageConfig.s3Client) {
      throw new ServiceUnavailableException(
        "Storage is not configured. S3 credentials are required.",
      );
    }

    if (!this.storageConfig.signingSecret) {
      throw new ServiceUnavailableException(
        "Storage signing is not configured. API_KEY_SECRET is required.",
      );
    }

    const { projectId } = extractContextInfo(request, undefined);

    // Validate contentType using RFC 7231 compliant parser
    // Throws TypeError if invalid, which we convert to BadRequestException
    try {
      parseContentType(dto.contentType);
    } catch {
      throw new BadRequestException("Invalid contentType format");
    }

    // Generate a short unique ID and build the signed storage key
    // Key format is deterministic: {projectId}/{uniqueId}-{signature}
    // Max ~70 chars, well under S3's 1024 byte limit
    const uniqueId = generateUniqueId();
    const storageKey = buildStorageKey(
      projectId,
      uniqueId,
      this.storageConfig.signingSecret,
    );

    try {
      const uploadUrl = await getSignedUploadUrl(
        this.storageConfig.s3Client,
        this.storageConfig.bucket,
        storageKey,
        dto.contentType,
        PRESIGN_EXPIRY_SECONDS,
      );

      return {
        uploadUrl,
        attachmentUri: buildAttachmentUri(projectId, uniqueId),
        expiresIn: PRESIGN_EXPIRY_SECONDS,
      };
    } catch (error) {
      // Preserve full error object for $metadata/stack traces in production logs
      this.logger.error(
        `Failed to generate presigned URL for project ${projectId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadGatewayException("Failed to create upload URL");
    }
  }
}
