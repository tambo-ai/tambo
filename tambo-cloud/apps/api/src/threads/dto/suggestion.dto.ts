import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

@ApiSchema({ name: "Suggestion" })
export class SuggestionDto {
  @ApiProperty({
    description: "Unique identifier for the suggestion",
    example: "sug_123456789",
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    description: "ID of the message this suggestion is for",
    example: "msg_123456789",
  })
  @IsString()
  @IsNotEmpty()
  messageId!: string;

  @ApiProperty({
    description: "Short title or summary of the suggestion",
    example: "Add error handling",
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: "Detailed explanation of the suggestion",
    example: "Add try-catch block to handle potential API errors",
  })
  @IsString()
  @IsNotEmpty()
  detailedSuggestion!: string;

  @ApiProperty({
    description: "Additional metadata for the suggestion",
    required: false,
    additionalProperties: { type: "string" },
    example: { category: "error-handling", priority: "high" },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
