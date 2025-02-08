import { AvailableComponent } from '@use-hydra-ai/hydra-ai-server';
import { LegacyChatMessage } from './legacy-chat-history.dto';

export class HydrateComponentRequest {
  messageHistory!: LegacyChatMessage[];
  component!: AvailableComponent;
  toolResponse?: any;
  threadId?: string;
  contextKey?: string;
}
