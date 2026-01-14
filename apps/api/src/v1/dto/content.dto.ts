import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  ValidateNested,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Equals,
  IsNotEmpty,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";
import { ResourceDto } from "../../threads/dto/message.dto";

/**
 * Union type for all content block types.
 * Used for type-safe content handling.
 */
export type ContentBlock =
  | TextContentDto
  | ResourceContentDto
  | ToolUseContentDto
  | ToolResultContentDto
  | ComponentContentDto;

/**
 * Text content block.
 */
@ApiSchema({ name: "V1TextContent" })
export class TextContentDto {
  @ApiProperty({
    description: "Content block type identifier",
    enum: ["text"],
    example: "text",
  })
  @Equals("text")
  readonly type!: "text"; // No default value - use definite assignment

  @ApiProperty({
    description: "The text content",
    example: "Hello, world!",
  })
  @IsString()
  @IsNotEmpty()
  text!: string;
}

/**
 * Resource content block for files, URLs, or binary data.
 */
@ApiSchema({ name: "V1ResourceContent" })
export class ResourceContentDto {
  @ApiProperty({
    description: "Content block type identifier",
    enum: ["resource"],
    example: "resource",
  })
  @Equals("resource")
  readonly type!: "resource";

  @ApiProperty({
    description: "Resource data containing URI, text, or blob",
  })
  @ValidateNested()
  @Type(() => ResourceDto)
  resource!: ResourceDto;
}

/**
 * Tool use content block - represents a tool call from the assistant.
 */
@ApiSchema({ name: "V1ToolUseContent" })
export class ToolUseContentDto {
  @ApiProperty({
    description: "Content block type identifier",
    enum: ["tool_use"],
    example: "tool_use",
  })
  @Equals("tool_use")
  readonly type!: "tool_use";

  @ApiProperty({
    description: "Unique identifier for this tool call",
    example: "call_abc123",
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    description: "Name of the tool being called",
    example: "get_weather",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: "Input arguments for the tool",
    example: { location: "San Francisco", unit: "celsius" },
  })
  @IsObject()
  input!: Record<string, unknown>;
}

/**
 * Tool result content block - represents the result of a tool call.
 */
@ApiSchema({ name: "V1ToolResultContent" })
export class ToolResultContentDto {
  @ApiProperty({
    description: "Content block type identifier",
    enum: ["tool_result"],
    example: "tool_result",
  })
  @Equals("tool_result")
  readonly type!: "tool_result";

  @ApiProperty({
    description: "ID of the tool call this result responds to",
    example: "call_abc123",
  })
  @IsString()
  @IsNotEmpty()
  toolUseId!: string;

  @ApiProperty({
    description: "Result content (text or resource blocks)",
    type: [Object],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object, {
    discriminator: {
      property: "type",
      subTypes: [
        { value: TextContentDto, name: "text" },
        { value: ResourceContentDto, name: "resource" },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  content!: (TextContentDto | ResourceContentDto)[];

  @ApiProperty({
    description: "Whether the tool call resulted in an error",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isError?: boolean;
}

/**
 * Component content block - represents a UI component rendered by the client.
 */
@ApiSchema({ name: "V1ComponentContent" })
export class ComponentContentDto {
  @ApiProperty({
    description: "Content block type identifier",
    enum: ["component"],
    example: "component",
  })
  @Equals("component")
  readonly type!: "component";

  @ApiProperty({
    description: "Unique identifier for this component instance",
    example: "comp_xyz789",
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    description: "Name of the component to render",
    example: "WeatherCard",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: "Props to pass to the component",
    example: { temperature: 72, location: "San Francisco" },
  })
  @IsObject()
  props!: Record<string, unknown>;

  @ApiProperty({
    description: "Current state of the component",
    required: false,
  })
  @IsOptional()
  @IsObject()
  state?: Record<string, unknown>;
}

/**
 * Helper for discriminated union validation in nested arrays.
 * Used with @Type() decorator to properly validate content blocks.
 */
export const contentBlockDiscriminator = {
  discriminator: {
    property: "type",
    subTypes: [
      { value: TextContentDto, name: "text" },
      { value: ResourceContentDto, name: "resource" },
      { value: ToolUseContentDto, name: "tool_use" },
      { value: ToolResultContentDto, name: "tool_result" },
      { value: ComponentContentDto, name: "component" },
    ],
  },
  keepDiscriminatorProperty: true,
};
