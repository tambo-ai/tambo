import { AvailableComponent } from '@use-hydra-ai/hydra-ai-server';
import { LegacyChatMessageDto } from './legacy-chat-history.dto';

export class HydrateComponentRequest {
  messageHistory!: LegacyChatMessageDto[];
  component!: AvailableComponent;
  toolResponse?: any;
  threadId?: string;
  contextKey?: string;
}
export class HydrateComponentRequest2 {
  component!: AvailableComponent;
  toolResponse?: any;
  threadId!: string;
  contextKey?: string;
}
