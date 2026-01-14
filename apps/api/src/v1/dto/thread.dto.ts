import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, IsIn, IsObject } from "class-validator";
import { MessageDto } from "./message.dto";

/**
 * Run status for v1 API.
 * Tracks the lifecycle of a run on a thread.
 */
export type V1RunStatus =
  | "idle"
  | "running"
  | "awaiting_input"
  | "cancelled"
  | "failed";

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

  @ApiProperty({
    description: "Current run status",
    enum: ["idle", "running", "awaiting_input", "cancelled", "failed"],
    example: "idle",
  })
  @IsIn(["idle", "running", "awaiting_input", "cancelled", "failed"])
  runStatus!: V1RunStatus;

  @ApiProperty({
    description: "ID of the currently active run",
    required: false,
  })
  @IsOptional()
  @IsString()
  currentRunId?: string;

  @ApiProperty({
    description: "Human-readable status message",
    required: false,
    example: "Processing your request...",
  })
  @IsOptional()
  @IsString()
  statusMessage?: string;

  @ApiProperty({
    description: "Tool call IDs awaiting client-side results",
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  pendingToolCallIds?: string[];

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
