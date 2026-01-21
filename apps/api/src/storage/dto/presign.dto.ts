import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

/** Maximum file size in bytes (10MB, matching download limit) */
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export class PresignUploadDto {
  @ApiProperty({
    description: "The MIME type of the file",
    example: "application/pdf",
  })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({
    description: "The file size in bytes (max 10MB)",
    example: 1024000,
  })
  @IsNumber()
  @Min(1)
  @Max(MAX_ATTACHMENT_SIZE)
  size!: number;
}

export class PresignUploadResponseDto {
  @ApiProperty({
    description: "The presigned URL to PUT the file directly to S3",
    example: "https://s3.amazonaws.com/bucket/key?X-Amz-Signature=...",
  })
  uploadUrl!: string;

  @ApiProperty({
    description: "The attachment URI to reference this file in messages",
    example: "attachment://p_u2tgQg5U.43bbdf/Ab3xY9kLmN",
  })
  attachmentUri!: string;

  @ApiProperty({
    description: "Time in seconds until the presigned URL expires",
    example: 3600,
  })
  expiresIn!: number;
}
