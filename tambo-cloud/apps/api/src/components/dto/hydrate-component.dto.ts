import { ApiSchema } from '@nestjs/swagger';
import { AvailableComponentDto } from './generate-component.dto';
import { LegacyChatMessageDto } from './legacy-chat-history.dto';

@ApiSchema({
  description: `Hydrate a component with data from a tool call.
@deprecated Use HydrateComponentRequestV2 instead`,
})
export class HydrateComponentRequest {
  messageHistory!: LegacyChatMessageDto[];
  component!: AvailableComponentDto;
  toolResponse?: any;
  threadId?: string;
  contextKey?: string;
}
