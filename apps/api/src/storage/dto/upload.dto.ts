import { ApiProperty } from "@nestjs/swagger";

export class UploadResponseDto {
  @ApiProperty({
    description: "The attachment URI to reference this file in messages",
    example: "attachment://proj_123/1704567890-document.pdf",
  })
  attachmentUri!: string;
}
