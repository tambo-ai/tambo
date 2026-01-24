import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * JSON Patch operation (RFC 6902)
 * @see https://datatracker.ietf.org/doc/html/rfc6902
 */
@ApiSchema({ name: "JsonPatchOperation" })
export class JsonPatchOperationDto {
  @ApiProperty({
    description: "Operation type",
    enum: ["add", "remove", "replace", "move", "copy", "test"],
    example: "replace",
  })
  @IsEnum(["add", "remove", "replace", "move", "copy", "test"])
  op!: "add" | "remove" | "replace" | "move" | "copy" | "test";

  @ApiProperty({
    description: "JSON Pointer path to the target location",
    example: "/loading",
  })
  @IsString()
  path!: string;

  @ApiProperty({
    description:
      "Value to add, replace, or test (required for add, replace, test)",
    required: false,
    example: false,
  })
  @IsOptional()
  value?: unknown;

  @ApiProperty({
    description: "Source path for move and copy operations",
    required: false,
  })
  @IsOptional()
  @IsString()
  from?: string;
}

/**
 * Request to update component state.
 * Either state (full replacement) or patch (JSON Patch operations) must be provided.
 */
@ApiSchema({ name: "UpdateComponentState" })
export class UpdateComponentStateDto {
  @ApiProperty({
    description: "Full replacement state object",
    required: false,
    example: { loading: false, data: [1, 2, 3] },
  })
  @IsOptional()
  @IsObject()
  state?: Record<string, unknown>;

  @ApiProperty({
    description: "JSON Patch operations to apply to current state",
    required: false,
    type: [JsonPatchOperationDto],
    example: [
      { op: "replace", path: "/loading", value: false },
      { op: "add", path: "/data/-", value: 4 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JsonPatchOperationDto)
  patch?: JsonPatchOperationDto[];
}

/**
 * Response after updating component state.
 */
@ApiSchema({ name: "UpdateComponentStateResponse" })
export class UpdateComponentStateResponseDto {
  @ApiProperty({
    description: "New complete state of the component",
    example: { loading: false, data: [1, 2, 3, 4] },
  })
  @IsObject()
  state!: Record<string, unknown>;
}
