import { ApiProperty } from "@nestjs/swagger";

export class UploadResponseDto {
  @ApiProperty({
    description: "The attachment URI to reference this file in messages",
    example:
      "attachment://p_u2tgQg5U.43bbdf/1704567890-550e8400-e29b-41d4-a716-446655440000-document.pdf",
  })
  attachmentUri!: string;
}
