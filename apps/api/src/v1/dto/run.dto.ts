import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  ValidateNested,
  IsArray,
  IsNumber,
  IsIn,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";
import { InputMessageDto } from "./message.dto";
import { ToolDto, AvailableComponentDto, ToolChoiceDto } from "./tool.dto";
import { CreateThreadDto } from "./thread.dto";

/**
 * Request DTO for creating a run on an existing thread.
 */
@ApiSchema({ name: "V1CreateRunRequest" })
export class CreateRunDto {
  @ApiProperty({
    description: "The user's message",
  })
  @ValidateNested()
  @Type(() => InputMessageDto)
  message!: InputMessageDto;

  @ApiProperty({
    description: "Available UI components the model can render",
    type: [AvailableComponentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailableComponentDto)
  availableComponents?: AvailableComponentDto[];

  @ApiProperty({
    description: "Client-side tools the model can call",
    type: [ToolDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToolDto)
  tools?: ToolDto[];

  @ApiProperty({
    description: "How the model should use tools",
    required: false,
    oneOf: [
      { type: "string", enum: ["auto", "required", "none"] },
      { type: "object", properties: { name: { type: "string" } } },
    ],
  })
  @IsOptional()
  toolChoice?: ToolChoiceDto;

  @ApiProperty({
    description: "Previous run ID for tool result submissions",
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
  })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiProperty({
    description: "Temperature for generation (0-2)",
    required: false,
  })
  @IsOptional()
  @IsNumber()
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
@ApiSchema({ name: "V1CreateThreadWithRunRequest" })
export class CreateThreadWithRunDto extends CreateRunDto {
  @ApiProperty({
    description: "Thread configuration",
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateThreadDto)
  thread?: CreateThreadDto;

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
 * Per the proposal, cancellation:
 * - Sets runStatus back to "idle"
 * - Sets lastRunCancelled to true on the thread
 */
@ApiSchema({ name: "V1CancelRunResponse" })
export class CancelRunResponseDto {
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
