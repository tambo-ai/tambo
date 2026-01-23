# API Decorators

Custom decorators for the Tambo Cloud API that reduce boilerplate and ensure consistency.

## @ApiDiscriminatedUnion

All-in-one decorator for discriminated unions that handles both runtime validation and OpenAPI documentation.

### The Problem

When defining discriminated unions in NestJS, you need to configure two separate systems:

1. **Runtime (class-transformer + class-validator)**: Handles JSON deserialization and validation
2. **Documentation (@nestjs/swagger)**: Generates OpenAPI schema

These systems don't share metadata, leading to ~30 lines of duplicated configuration per discriminated union property.

### The Solution

`@ApiDiscriminatedUnion` combines both configurations into a single decorator:

```typescript
// Before: 27 lines of duplicated configuration
@ApiProperty({
  description: "Content blocks",
  type: "array",
  items: {
    oneOf: [
      { $ref: getSchemaPath(TextDto) },
      { $ref: getSchemaPath(ResourceDto) },
    ],
    discriminator: {
      propertyName: "type",
      mapping: {
        text: getSchemaPath(TextDto),
        resource: getSchemaPath(ResourceDto),
      },
    },
  },
})
@ApiExtraModels(TextDto, ResourceDto)
@IsArray()
@ValidateNested({ each: true })
@Type(() => Object, {
  discriminator: {
    property: "type",
    subTypes: [
      { value: TextDto, name: "text" },
      { value: ResourceDto, name: "resource" },
    ],
  },
  keepDiscriminatorProperty: true,
})
content!: Array<TextDto | ResourceDto>;

// After: 6 lines, no duplication
@ApiDiscriminatedUnion({
  types: [
    { dto: TextDto, name: "text" },
    { dto: ResourceDto, name: "resource" },
  ],
  description: "Content blocks",
  isArray: true,
})
content!: Array<TextDto | ResourceDto>;
```

### Usage

#### Array of discriminated union types

```typescript
class MessageDto {
  @ApiDiscriminatedUnion({
    types: [
      { dto: V1TextContentDto, name: "text" },
      { dto: V1ResourceContentDto, name: "resource" },
      { dto: V1ToolResultContentDto, name: "tool_result" },
    ],
    description: "Content blocks in this message",
    isArray: true,
  })
  content!: V1ContentBlock[];
}
```

#### Single discriminated union value

```typescript
class ConfigDto {
  @ApiDiscriminatedUnion({
    types: [
      { dto: StringConfigDto, name: "string" },
      { dto: NumberConfigDto, name: "number" },
    ],
    description: "Configuration value",
    isArray: false,
  })
  value!: StringConfigDto | NumberConfigDto;
}
```

#### Custom discriminator property

```typescript
@ApiDiscriminatedUnion({
  types: [...],
  description: "Content with custom discriminator",
  isArray: true,
  discriminatorProperty: "kind", // Instead of "type"
})
content!: ContentBlock[];
```

#### Additional ApiProperty options

```typescript
@ApiDiscriminatedUnion({
  types: [...],
  description: "Optional content",
  isArray: true,
  additionalOptions: {
    required: false,
    nullable: true,
  },
})
content?: ContentBlock[] | null;
```

### Options

- **types** (required): Array of `{ dto, name }` mappings
  - `dto`: The DTO class (e.g., `V1TextContentDto`)
  - `name`: The discriminator value (e.g., `"text"`)
- **description**: Description for OpenAPI docs
- **isArray**: Whether property is an array (default: `false`)
- **discriminatorProperty**: Name of discriminator field (default: `"type"`)
- **keepDiscriminatorProperty**: Preserve discriminator in transformed objects (default: `true`)
- **additionalOptions**: Extra `@ApiProperty` options (required, nullable, etc.)

### What it does

1. Applies `@ApiExtraModels` to register DTO classes with Swagger
2. Applies `@ApiProperty` with `oneOf`/`discriminator` for OpenAPI schema
3. Applies `@IsArray` and `@ValidateNested` for array validation (when `isArray: true`)
4. Applies `@Type` with discriminator for runtime deserialization

### Testing

See `api-discriminated-union.decorator.test.ts` for examples and test coverage.

### Migration Guide

To migrate existing discriminated unions:

1. Find all uses of `@Type(() => Object, { discriminator: ... })`
2. Replace with `@ApiDiscriminatedUnion({ types: [...], ... })`
3. Remove the manual `@ApiProperty`, `@ApiExtraModels`, `@IsArray`, `@ValidateNested`, and `@Type` decorators
4. Verify tests pass and OpenAPI schema is correct

### Files

- `api-discriminated-union.decorator.ts` - Implementation
- `api-discriminated-union.decorator.test.ts` - Test suite
