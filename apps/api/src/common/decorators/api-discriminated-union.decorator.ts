import { applyDecorators, type Type as NestType } from "@nestjs/common";
import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptions,
  getSchemaPath,
} from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";

/**
 * Type mapping for discriminated union members.
 */
export interface DiscriminatedUnionType {
  /** The DTO class */
  dto: NestType<unknown>;
  /** The discriminator value (e.g., "text", "resource") */
  name: string;
}

/**
 * Options for ApiDiscriminatedUnion decorator.
 */
export interface ApiDiscriminatedUnionOptions {
  /** Array of types in the discriminated union */
  types: DiscriminatedUnionType[];
  /** Description for the property */
  description?: string;
  /** Whether the property is an array */
  isArray?: boolean;
  /** Discriminator property name (defaults to "type") */
  discriminatorProperty?: string;
  /** Whether to keep the discriminator property in transformed objects */
  keepDiscriminatorProperty?: boolean;
  /** Additional ApiProperty options to merge */
  additionalOptions?: Partial<ApiPropertyOptions>;
}

/**
 * All-in-one decorator for discriminated unions that handles both:
 * 1. Runtime validation/deserialization (class-transformer + class-validator)
 * 2. OpenAPI schema generation (@nestjs/swagger)
 *
 * @example
 * ```typescript
 * class MessageDto {
 *   @ApiDiscriminatedUnion({
 *     types: [
 *       { dto: TextContentDto, name: "text" },
 *       { dto: ResourceContentDto, name: "resource" },
 *     ],
 *     description: "Content blocks",
 *     isArray: true,
 *   })
 *   content!: ContentBlock[];
 * }
 * ```
 *
 * This replaces the need for manual:
 * - @ApiProperty with oneOf/discriminator
 * - @ApiExtraModels
 * - @Type with discriminator
 * - @IsArray / @ValidateNested
 */
export function ApiDiscriminatedUnion(
  options: ApiDiscriminatedUnionOptions,
): PropertyDecorator {
  const {
    types,
    description,
    isArray = false,
    discriminatorProperty = "type",
    keepDiscriminatorProperty = true,
    additionalOptions = {},
  } = options;

  // Build discriminator mapping for class-transformer (runtime)
  const classTransformerDiscriminator = {
    discriminator: {
      property: discriminatorProperty,
      subTypes: types.map(({ dto, name }) => ({ value: dto, name })),
    },
    keepDiscriminatorProperty,
  };

  // Build discriminator mapping for Swagger (docs)
  const swaggerDiscriminatorMapping = Object.fromEntries(
    types.map(({ dto, name }) => [name, getSchemaPath(dto)]),
  );

  const swaggerSchema = {
    oneOf: types.map(({ dto }) => ({ $ref: getSchemaPath(dto) })),
    discriminator: {
      propertyName: discriminatorProperty,
      mapping: swaggerDiscriminatorMapping,
    },
  };

  // Build the ApiProperty options
  // Note: Using 'as any' to work around complex ApiPropertyOptions union types
  // This is safe because we're mirroring the structure used in the DTOs
  const apiPropertyOptions: any = {
    description,
    ...additionalOptions,
  };

  if (isArray) {
    // For arrays, use items with oneOf
    apiPropertyOptions.type = "array";
    apiPropertyOptions.items = swaggerSchema;
  } else {
    // For single values, use schema with oneOf
    apiPropertyOptions.schema = swaggerSchema;
  }

  return applyDecorators(
    // Register all DTO types with Swagger
    ApiExtraModels(...types.map((t) => t.dto)),

    // OpenAPI property definition
    ApiProperty(apiPropertyOptions),

    // Runtime validation
    ...(isArray ? [IsArray(), ValidateNested({ each: true })] : []),

    // Runtime deserialization
    Type(() => Object, classTransformerDiscriminator),
  );
}
