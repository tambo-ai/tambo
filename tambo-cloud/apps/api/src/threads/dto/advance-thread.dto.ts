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
  contextKey?: string;
  availableComponents?: AvailableComponentDto[];
  clientTools?: ComponentContextToolMetadataDto[];
  additionalContext?: string;
  forceToolChoice?: string;
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
      "MCP access token to be used as bearer token when talking to the Tambo MCP server",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  mcpAccessToken!: string;
}
