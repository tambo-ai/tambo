import { ApiSchema } from "@nestjs/swagger";
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
  responseMessageDto!: ThreadMessageDto;
  generationStage!: GenerationStage;
  statusMessage?: string;
}
