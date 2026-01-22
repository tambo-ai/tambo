import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber } from "class-validator";

/**
 * Base AG-UI event structure.
 *
 * All events streamed via SSE conform to this base structure.
 * The `type` field discriminates between different event types.
 *
 * Matches the BaseEvent interface from @ag-ui/core.
 *
 * Consumers should cast to specific event types based on the `type` field:
 * - RUN_STARTED, RUN_FINISHED, RUN_ERROR
 * - TEXT_MESSAGE_START, TEXT_MESSAGE_CONTENT, TEXT_MESSAGE_END
 * - TOOL_CALL_START, TOOL_CALL_ARGS, TOOL_CALL_END
 * - And others from the AG-UI protocol
 */
@ApiSchema({ name: "BaseEvent" })
export class V1BaseEventDto {
  @ApiProperty({
    description:
      "Event type discriminator (e.g., RUN_STARTED, TEXT_MESSAGE_CONTENT, TOOL_CALL_START)",
    example: "TEXT_MESSAGE_CONTENT",
  })
  @IsString()
  type!: string;

  @ApiProperty({
    description: "Unix timestamp (milliseconds) when event was generated",
    required: false,
    example: 1705334400000,
  })
  @IsOptional()
  @IsNumber()
  timestamp?: number;

  /**
   * Additional event-specific fields.
   * Structure varies by event type.
   */
  [key: string]: unknown;
}
