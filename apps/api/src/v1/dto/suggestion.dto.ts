import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsObject,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";
import { V1AvailableComponentDto } from "./tool.dto";

/**
 * V1 Suggestion response DTO.
 * Represents a suggested next action or message for the user.
 */
@ApiSchema({ name: "Suggestion" })
export class V1SuggestionDto {
  @ApiProperty({
    description: "Unique identifier for this suggestion",
    example: "sug_abc123xyz",
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: "ID of the message this suggestion relates to",
    example: "msg_xyz789",
  })
  @IsString()
  messageId!: string;

  @ApiProperty({
    description: "Short title summarizing the suggestion",
    example: "Add error handling",
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: "Detailed explanation of the suggestion",
    example:
      "Add try-catch blocks to handle potential API errors and provide user feedback",
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: "When the suggestion was created (ISO 8601)",
    example: "2024-01-15T12:00:00Z",
  })
  @IsString()
  createdAt!: string;

  @ApiProperty({
    description: "Additional metadata",
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/**
 * Request DTO for generating suggestions.
 */
@ApiSchema({ name: "GenerateSuggestionsRequest" })
export class V1GenerateSuggestionsDto {
  @ApiProperty({
    description:
      "Identifier for a user in your system. Required if no bearer token is provided.",
    required: false,
  })
  @IsOptional()
  @IsString()
  userKey?: string;

  @ApiProperty({
    description: "Maximum number of suggestions to generate (1-10)",
    required: false,
    default: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxSuggestions?: number;

  @ApiProperty({
    description: "Available components that suggestions can reference",
    type: [V1AvailableComponentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => V1AvailableComponentDto)
  availableComponents?: V1AvailableComponentDto[];
}

/**
 * Response DTO for listing suggestions.
 */
@ApiSchema({ name: "ListSuggestionsResponse" })
export class V1ListSuggestionsResponseDto {
  @ApiProperty({
    description: "List of suggestions for the message",
    type: [V1SuggestionDto],
  })
  suggestions!: V1SuggestionDto[];

  @ApiProperty({
    description: "Cursor for the next page of results",
    required: false,
  })
  @IsOptional()
  @IsString()
  nextCursor?: string;

  @ApiProperty({
    description: "Whether there are more results",
  })
  hasMore!: boolean;
}

/**
 * Response DTO for generating suggestions.
 * Same shape as list response for consistency.
 */
@ApiSchema({ name: "GenerateSuggestionsResponse" })
export class V1GenerateSuggestionsResponseDto extends V1ListSuggestionsResponseDto {}

/**
 * Query parameters for listing suggestions.
 */
@ApiSchema({ name: "ListSuggestionsQuery" })
export class V1ListSuggestionsQueryDto {
  @ApiProperty({
    description: "Maximum number of suggestions to return",
    required: false,
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description: "Cursor for pagination",
    required: false,
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
