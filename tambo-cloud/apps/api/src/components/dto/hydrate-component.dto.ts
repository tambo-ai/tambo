import { AvailableComponentDto } from './generate-component.dto';
import { LegacyChatMessageDto } from './legacy-chat-history.dto';

export class HydrateComponentRequest {
  messageHistory!: LegacyChatMessageDto[];
  component!: AvailableComponentDto;
  toolResponse?: any;
  threadId?: string;
  contextKey?: string;
}
export class HydrateComponentRequest2 {
  component!: AvailableComponentDto;
  toolResponse?: any;
  threadId!: string;
  contextKey?: string;
}
