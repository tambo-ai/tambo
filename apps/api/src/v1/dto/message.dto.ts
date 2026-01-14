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
  ContentBlock,
  TextContentDto,
  ResourceContentDto,
  ToolResultContentDto,
  contentBlockDiscriminator,
} from "./content.dto";

/**
 * Message role following OpenAI/Anthropic conventions.
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * V1 Message response DTO.
 * Represents a message in a thread.
 */
@ApiSchema({ name: "V1Message" })
export class MessageDto {
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
  role!: MessageRole;

  @ApiProperty({
    description: "Content blocks in this message",
    type: [Object],
  })
  @IsArray()
  content!: ContentBlock[];

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
export type InputContent =
  | TextContentDto
  | ResourceContentDto
  | ToolResultContentDto;

/**
 * Input message for requests.
 * Only "user" role is allowed for input messages.
 */
@ApiSchema({ name: "V1InputMessage" })
export class InputMessageDto {
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
    ...contentBlockDiscriminator,
    // Override to only allow input content types
    discriminator: {
      property: "type",
      subTypes: [
        { value: TextContentDto, name: "text" },
        { value: ResourceContentDto, name: "resource" },
        { value: ToolResultContentDto, name: "tool_result" },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  content!: InputContent[];

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
@ApiSchema({ name: "V1ListMessagesResponse" })
export class ListMessagesResponseDto {
  @ApiProperty({
    description: "List of messages in the thread",
    type: [MessageDto],
  })
  messages!: MessageDto[];

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
@ApiSchema({ name: "V1ListMessagesQuery" })
export class ListMessagesQueryDto {
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
@ApiSchema({ name: "V1GetMessageResponse" })
export class GetMessageResponseDto extends MessageDto {}
