import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { GenerationStage } from "@tambo-ai-cloud/core";
import {
  AvailableComponentDto,
  ComponentContextToolMetadataDto,
} from "./generate-component.dto";
import { MessageRequest, ThreadMessageDto } from "./message.dto";

@ApiSchema({ name: "AdvanceThread" })
export class AdvanceThreadDto {
  messageToAppend!: MessageRequest;
  @ApiProperty({
    description: "Unique user identifier for the thread",
  })
  contextKey?: string;
  availableComponents?: AvailableComponentDto[];
  clientTools?: ComponentContextToolMetadataDto[];
  forceToolChoice?: string;
  @ApiProperty({
    description: "Tool call counts",
    example: {
      tool_name: 1,
    },
    additionalProperties: {
      type: "number",
    },
  })
  toolCallCounts?: Record<string, number>;
  @ApiProperty({
    description: "Initial messages to include when creating a new thread",
    type: [MessageRequest],
    required: false,
  })
  initialMessages?: MessageRequest[];
}

@ApiSchema({ name: "AdvanceThreadResponse" })
export class AdvanceThreadResponseDto {
  @ApiProperty({
    description: "Response message",
    example: {
      role: "assistant",
      content: "Hello, how are you?",
    },
  })
  responseMessageDto!: ThreadMessageDto;
  generationStage!: GenerationStage;
  @ApiProperty({
    description: "Status message for the generation stage",
    example: "Streaming response...",
  })
  statusMessage?: string;
  @ApiProperty({
    description:
      "MCP access token to be used as bearer token when talking to the Tambo MCP server. Only included when MCP servers are configured for the project.",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    required: false,
  })
  mcpAccessToken?: string;
}
