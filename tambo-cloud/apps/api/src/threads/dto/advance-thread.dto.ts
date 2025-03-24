import { ApiSchema } from "@nestjs/swagger";
import { GenerationStage } from "@tambo-ai-cloud/core";
import { AvailableComponentDto } from "../../components/dto/generate-component.dto";
import { MessageRequest, ThreadMessageDto } from "./message.dto";

@ApiSchema({ name: "AdvanceThread" })
export class AdvanceThreadDto {
  messageToAppend!: MessageRequest;
  contextKey?: string;
  availableComponents?: AvailableComponentDto[];
}

@ApiSchema({ name: "AdvanceThreadResponse" })
export class AdvanceThreadResponseDto {
  responseMessageDto!: ThreadMessageDto;
  generationStage!: GenerationStage;
  statusMessage?: string;
}
