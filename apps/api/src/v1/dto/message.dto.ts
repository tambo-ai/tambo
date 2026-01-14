import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  ValidateNested,
  IsArray,
  IsNotEmpty,
  IsIn,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";
import {
  V1ContentBlock,
  V1TextContentDto,
  V1ResourceContentDto,
  V1ToolResultContentDto,
  v1ContentBlockDiscriminator,
} from "./content.dto";

/**
 * Message role following OpenAI/Anthropic conventions.
 */
export type V1MessageRole = "user" | "assistant" | "system";

/**
 * V1 Message response DTO.
 * Represents a message in a thread.
 */
@ApiSchema({ name: "Message" })
export class V1MessageDto {
  @ApiProperty({
    description: "Unique identifier for this message",
    example: "msg_abc123xyz",
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: "Message role",
    enum: ["user", "assistant", "system"],
    example: "assistant",
  })
  @IsIn(["user", "assistant", "system"])
  role!: V1MessageRole;

  @ApiProperty({
    description: "Content blocks in this message",
    type: [Object],
  })
  @IsArray()
  content!: V1ContentBlock[];

  @ApiProperty({
    description: "When the message was created (ISO 8601)",
    example: "2024-01-15T12:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsString()
  createdAt?: string;

  @ApiProperty({
    description: "Additional metadata",
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/**
 * Input content - subset allowed in user messages.
 * Users can send text, resources, or tool results.
 */
export type V1InputContent =
  | V1TextContentDto
  | V1ResourceContentDto
  | V1ToolResultContentDto;

/**
 * Input message for requests.
 * Only "user" role is allowed for input messages.
 */
@ApiSchema({ name: "InputMessage" })
export class V1InputMessageDto {
  @ApiProperty({
    description: "Message role - must be 'user' for input messages",
    enum: ["user"],
    example: "user",
  })
  @IsIn(["user"])
  role!: "user";

  @ApiProperty({
    description: "Content blocks (text, resource, or tool_result)",
    type: [Object],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Object, {
    ...v1ContentBlockDiscriminator,
    // Override to only allow input content types
    discriminator: {
      property: "type",
      subTypes: [
        { value: V1TextContentDto, name: "text" },
        { value: V1ResourceContentDto, name: "resource" },
        { value: V1ToolResultContentDto, name: "tool_result" },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  content!: V1InputContent[];

  @ApiProperty({
    description: "Additional metadata to attach to the message",
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/**
 * Response DTO for listing messages.
 */
@ApiSchema({ name: "ListMessagesResponse" })
export class V1ListMessagesResponseDto {
  @ApiProperty({
    description: "List of messages in the thread",
    type: [V1MessageDto],
  })
  messages!: V1MessageDto[];

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
 * Query parameters for listing messages.
 */
@ApiSchema({ name: "ListMessagesQuery" })
export class V1ListMessagesQueryDto {
  @ApiProperty({
    description: "Maximum number of messages to return",
    required: false,
    default: 50,
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({
    description: "Cursor for pagination",
    required: false,
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({
    description: "Sort order: 'asc' for oldest first, 'desc' for newest first",
    enum: ["asc", "desc"],
    required: false,
    default: "asc",
  })
  @IsOptional()
  @IsIn(["asc", "desc"])
  order?: "asc" | "desc";
}

/**
 * Response DTO for getting a single message.
 */
@ApiSchema({ name: "GetMessageResponse" })
export class V1GetMessageResponseDto extends V1MessageDto {}
