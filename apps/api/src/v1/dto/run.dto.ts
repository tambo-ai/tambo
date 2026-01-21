import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  ValidateNested,
  IsArray,
  IsNumber,
  IsIn,
  IsObject,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { V1InputMessageDto } from "./message.dto";
import {
  V1ToolDto,
  V1AvailableComponentDto,
  V1ToolChoiceDto,
} from "./tool.dto";
import { V1CreateThreadDto } from "./thread.dto";

/**
 * Request DTO for creating a run on an existing thread.
 */
@ApiSchema({ name: "CreateRunRequest" })
export class V1CreateRunDto {
  @ApiProperty({
    description: "The user's message",
  })
  @ValidateNested()
  @Type(() => V1InputMessageDto)
  message!: V1InputMessageDto;

  @ApiProperty({
    description: "Available UI components the model can render",
    type: [V1AvailableComponentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => V1AvailableComponentDto)
  availableComponents?: V1AvailableComponentDto[];

  @ApiProperty({
    description: "Client-side tools the model can call",
    type: [V1ToolDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => V1ToolDto)
  tools?: V1ToolDto[];

  @ApiProperty({
    description: "How the model should use tools",
    required: false,
    oneOf: [
      { type: "string", enum: ["auto", "required", "none"] },
      { type: "object", properties: { name: { type: "string" } } },
    ],
  })
  @IsOptional()
  toolChoice?: V1ToolChoiceDto;

  @ApiProperty({
    description:
      "ID of the previous run. Required when continuing a thread that already has messages.",
    required: false,
  })
  @IsOptional()
  @IsString()
  previousRunId?: string;

  @ApiProperty({
    description: "Override the default model",
    required: false,
    example: "gpt-4o",
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({
    description: "Maximum tokens to generate",
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @ApiProperty({
    description: "Temperature for generation (0-2)",
    required: false,
    minimum: 0,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({
    description: "Metadata for the run",
    required: false,
  })
  @IsOptional()
  @IsObject()
  runMetadata?: Record<string, unknown>;
}

/**
 * Request DTO for creating a thread with a run.
 */
@ApiSchema({ name: "CreateThreadWithRunRequest" })
export class V1CreateThreadWithRunDto extends V1CreateRunDto {
  @ApiProperty({
    description: "Thread configuration",
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => V1CreateThreadDto)
  thread?: V1CreateThreadDto;

  @ApiProperty({
    description: "Metadata for the thread",
    required: false,
  })
  @IsOptional()
  @IsObject()
  threadMetadata?: Record<string, unknown>;
}

/**
 * Response DTO for cancelling a run.
 *
 * Cancellation sets runStatus back to "idle" and lastRunCancelled to true on the thread.
 */
@ApiSchema({ name: "CancelRunResponse" })
export class V1CancelRunResponseDto {
  @ApiProperty({
    description: "The run ID that was cancelled",
  })
  @IsString()
  runId!: string;

  @ApiProperty({
    description: "New status after cancellation (always 'cancelled')",
    enum: ["cancelled"],
  })
  @IsIn(["cancelled"])
  status!: "cancelled";
}
