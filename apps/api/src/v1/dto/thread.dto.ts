import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsArray,
  IsIn,
  IsObject,
  IsBoolean,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { MessageDto } from "./message.dto";
import { V1RunStatus } from "@tambo-ai-cloud/core";

// Re-export for convenience
export { V1RunStatus } from "@tambo-ai-cloud/core";

/**
 * Error information from a failed run.
 */
@ApiSchema({ name: "V1RunError" })
export class RunErrorDto {
  @ApiProperty({
    description: "Error code",
    example: "INTERNAL_ERROR",
    required: false,
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: "Error message",
    example: "An unexpected error occurred",
  })
  @IsString()
  message!: string;
}

/**
 * V1 Thread response DTO.
 *
 * Thread state is divided into three concerns:
 * 1. Current run lifecycle (runStatus) - is a run active right now?
 * 2. Last run outcome (lastRunCancelled, lastRunError) - how did it end?
 * 3. Next run requirements (pendingToolCallIds) - what must the next run provide?
 */
@ApiSchema({ name: "V1Thread" })
export class ThreadDto {
  @ApiProperty({
    description: "Unique identifier for this thread",
    example: "thr_abc123xyz",
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: "Project this thread belongs to",
    example: "prj_xyz789",
  })
  @IsString()
  projectId!: string;

  @ApiProperty({
    description: "Optional context key for thread organization",
    required: false,
  })
  @IsOptional()
  @IsString()
  contextKey?: string;

  // ==========================================
  // 1. Current run lifecycle
  // ==========================================

  @ApiProperty({
    description:
      "Current run status: idle (no run), waiting (run started, awaiting content), streaming (receiving content)",
    enum: ["idle", "waiting", "streaming"],
    example: "idle",
  })
  @IsIn(["idle", "waiting", "streaming"])
  runStatus!: V1RunStatus;

  @ApiProperty({
    description: "ID of the currently active run (when not idle)",
    required: false,
  })
  @IsOptional()
  @IsString()
  currentRunId?: string;

  @ApiProperty({
    description:
      "Human-readable status message (e.g., 'Fetching weather data...')",
    required: false,
  })
  @IsOptional()
  @IsString()
  statusMessage?: string;

  // ==========================================
  // 2. Last run outcome (cleared when next run starts)
  // ==========================================

  @ApiProperty({
    description: "Whether the last run was cancelled",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  lastRunCancelled?: boolean;

  @ApiProperty({
    description: "Error information from the last run",
    required: false,
    type: RunErrorDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RunErrorDto)
  lastRunError?: RunErrorDto;

  // ==========================================
  // 3. Next run requirements
  // ==========================================

  @ApiProperty({
    description:
      "Tool call IDs awaiting client-side results. If non-empty, next run must provide tool_result content with previousRunId set.",
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  pendingToolCallIds?: string[];

  @ApiProperty({
    description:
      "ID of the last completed run. Required as previousRunId when continuing after tool calls.",
    required: false,
  })
  @IsOptional()
  @IsString()
  lastCompletedRunId?: string;

  // ==========================================
  // Metadata & timestamps
  // ==========================================

  @ApiProperty({
    description: "Additional metadata",
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: "When the thread was created (ISO 8601)",
    example: "2024-01-15T12:00:00Z",
  })
  @IsString()
  createdAt!: string;

  @ApiProperty({
    description: "When the thread was last updated (ISO 8601)",
    example: "2024-01-15T12:05:00Z",
  })
  @IsString()
  updatedAt!: string;
}

/**
 * Thread response with messages included.
 */
@ApiSchema({ name: "V1ThreadWithMessages" })
export class ThreadWithMessagesDto extends ThreadDto {
  @ApiProperty({
    description: "Messages in this thread",
    type: [MessageDto],
  })
  @IsArray()
  messages!: MessageDto[];
}

/**
 * Request DTO for creating a thread.
 */
@ApiSchema({ name: "V1CreateThreadRequest" })
export class CreateThreadDto {
  @ApiProperty({
    description: "Optional context key for thread organization",
    required: false,
  })
  @IsOptional()
  @IsString()
  contextKey?: string;

  @ApiProperty({
    description: "Additional metadata to attach to the thread",
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/**
 * Response DTO for creating a thread.
 */
@ApiSchema({ name: "V1CreateThreadResponse" })
export class CreateThreadResponseDto extends ThreadDto {}

/**
 * Response DTO for getting a thread.
 */
@ApiSchema({ name: "V1GetThreadResponse" })
export class GetThreadResponseDto extends ThreadWithMessagesDto {}

/**
 * Query parameters for listing threads.
 */
@ApiSchema({ name: "V1ListThreadsQuery" })
export class ListThreadsQueryDto {
  @ApiProperty({
    description: "Maximum number of threads to return",
    required: false,
    default: 20,
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
    description: "Filter by context key",
    required: false,
  })
  @IsOptional()
  @IsString()
  contextKey?: string;
}

/**
 * Response DTO for listing threads.
 */
@ApiSchema({ name: "V1ListThreadsResponse" })
export class ListThreadsResponseDto {
  @ApiProperty({
    description: "List of threads",
    type: [ThreadDto],
  })
  @IsArray()
  threads!: ThreadDto[];

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
