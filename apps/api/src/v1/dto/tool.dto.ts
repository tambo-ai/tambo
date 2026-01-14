import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsObject,
} from "class-validator";

/**
 * Tool definition for client-side tools.
 * Follows OpenAI/Anthropic/MCP conventions.
 */
@ApiSchema({ name: "Tool" })
export class V1ToolDto {
  @ApiProperty({
    description: "Unique tool name (a-z, A-Z, 0-9, _, -)",
    example: "get_weather",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: "Description of what the tool does",
    example: "Get the current weather for a location",
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: "JSON Schema for the tool's input parameters",
    example: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" },
        unit: { type: "string", enum: ["celsius", "fahrenheit"] },
      },
      required: ["location"],
    },
  })
  @IsObject()
  inputSchema!: object;

  @ApiProperty({
    description: "Optional JSON Schema for structured output",
    required: false,
  })
  @IsOptional()
  @IsObject()
  outputSchema?: object;

  @ApiProperty({
    description: "Enable strict schema validation (OpenAI feature)",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  strict?: boolean;
}

/**
 * Available component definition.
 * Describes a UI component the model can render.
 *
 * Note: Uses V1AvailableComponent API schema name to avoid collision
 * with existing AvailableComponent in threads DTOs.
 */
@ApiSchema({ name: "V1AvailableComponent" })
export class V1AvailableComponentDto {
  @ApiProperty({
    description: "Component name (e.g., 'StockChart')",
    example: "WeatherCard",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: "Description of what this component displays",
    example: "Displays weather information for a location",
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: "JSON Schema for component props",
    example: {
      type: "object",
      properties: {
        temperature: { type: "number" },
        location: { type: "string" },
        unit: { type: "string", enum: ["celsius", "fahrenheit"] },
      },
      required: ["temperature", "location"],
    },
  })
  @IsObject()
  propsSchema!: object;

  @ApiProperty({
    description: "Optional JSON Schema for component state",
    required: false,
  })
  @IsOptional()
  @IsObject()
  stateSchema?: object;
}

/**
 * Tool choice for named tool forcing.
 */
@ApiSchema({ name: "ToolChoiceNamed" })
export class V1ToolChoiceNamedDto {
  @ApiProperty({
    description: "Name of the tool that must be used",
    example: "get_weather",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

/**
 * Tool choice union type.
 * Controls how the model uses tools.
 */
export type V1ToolChoiceDto =
  | "auto" // Model decides (default)
  | "required" // Must use at least one tool
  | "none" // Cannot use tools
  | V1ToolChoiceNamedDto; // Must use specific tool
