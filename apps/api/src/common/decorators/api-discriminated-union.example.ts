/**
 * Example usage of @ApiDiscriminatedUnion decorator
 *
 * This file demonstrates the before/after comparison.
 * DO NOT import this file - it's for documentation only.
 */

/* eslint-disable */

import { ApiProperty, ApiExtraModels, getSchemaPath } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { ApiDiscriminatedUnion } from "./api-discriminated-union.decorator";

// Dummy DTOs for example
class TextContentDto {
  type!: "text";
  text!: string;
}
class ResourceContentDto {
  type!: "resource";
  resource!: any;
}
class ToolResultContentDto {
  type!: "tool_result";
  toolUseId!: string;
}

// ============================================================================
// BEFORE: Manual approach (27 lines of decorators + duplication)
// ============================================================================

class MessageDtoBefore {
  @ApiProperty({
    description: "Content blocks",
    type: "array",
    items: {
      oneOf: [
        { $ref: getSchemaPath(TextContentDto) },
        { $ref: getSchemaPath(ResourceContentDto) },
        { $ref: getSchemaPath(ToolResultContentDto) },
      ],
      discriminator: {
        propertyName: "type",
        mapping: {
          text: getSchemaPath(TextContentDto),
          resource: getSchemaPath(ResourceContentDto),
          tool_result: getSchemaPath(ToolResultContentDto),
        },
      },
    },
  })
  @ApiExtraModels(TextContentDto, ResourceContentDto, ToolResultContentDto)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object, {
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
  content!: Array<TextContentDto | ResourceContentDto | ToolResultContentDto>;
}

// ============================================================================
// AFTER: Using @ApiDiscriminatedUnion (6 lines, no duplication)
// ============================================================================

class MessageDtoAfter {
  @ApiDiscriminatedUnion({
    types: [
      { dto: TextContentDto, name: "text" },
      { dto: ResourceContentDto, name: "resource" },
      { dto: ToolResultContentDto, name: "tool_result" },
    ],
    description: "Content blocks",
    isArray: true,
  })
  content!: Array<TextContentDto | ResourceContentDto | ToolResultContentDto>;
}

// ============================================================================
// NON-ARRAY EXAMPLE: Single discriminated union value
// ============================================================================

class ConfigDtoAfter {
  @ApiDiscriminatedUnion({
    types: [
      { dto: TextContentDto, name: "text" },
      { dto: ResourceContentDto, name: "resource" },
    ],
    description: "Configuration value",
    isArray: false, // Single value, not array
  })
  value!: TextContentDto | ResourceContentDto;
}

// ============================================================================
// ADVANCED: Custom discriminator property name
// ============================================================================

class CustomDiscriminatorDto {
  @ApiDiscriminatedUnion({
    types: [
      { dto: TextContentDto, name: "text" },
      { dto: ResourceContentDto, name: "resource" },
    ],
    description: "Content with custom discriminator",
    isArray: true,
    discriminatorProperty: "kind", // Instead of "type"
  })
  content!: Array<TextContentDto | ResourceContentDto>;
}

// ============================================================================
// ADVANCED: Additional ApiProperty options
// ============================================================================

class OptionalContentDto {
  @ApiDiscriminatedUnion({
    types: [
      { dto: TextContentDto, name: "text" },
      { dto: ResourceContentDto, name: "resource" },
    ],
    description: "Optional content blocks",
    isArray: true,
    additionalOptions: {
      required: false,
      nullable: true,
    },
  })
  content?: Array<TextContentDto | ResourceContentDto> | null;
}
