import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class PresignUploadDto {
  @ApiProperty({
    description: "The filename to use for the uploaded file",
    example: "document.pdf",
  })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({
    description: "The MIME type of the file",
    example: "application/pdf",
  })
  @IsString()
  @IsNotEmpty()
  contentType!: string;
}

export class PresignUploadResponseDto {
  @ApiProperty({
    description: "The presigned URL to PUT the file directly to S3",
    example: "https://s3.amazonaws.com/bucket/key?X-Amz-Signature=...",
  })
  uploadUrl!: string;

  @ApiProperty({
    description: "The attachment URI to reference this file in messages",
    example:
      "attachment://p_u2tgQg5U.43bbdf/1704567890-550e8400-e29b-41d4-a716-446655440000-document.pdf",
  })
  attachmentUri!: string;

  @ApiProperty({
    description: "Time in seconds until the presigned URL expires",
    example: 3600,
  })
  expiresIn!: number;
}
