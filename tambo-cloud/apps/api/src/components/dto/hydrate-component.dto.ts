import { AvailableComponent, ChatMessage } from '@use-hydra-ai/hydra-ai-server';

export class HydrateComponentRequest {
  messageHistory?: ChatMessage[];
  component?: AvailableComponent;
  toolResponse?: any;
  threadId?: string;
  contextKey?: string;
}
