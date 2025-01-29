import {
  AvailableComponents,
  ChatMessage,
} from '@use-hydra-ai/hydra-ai-server';

export class GenerateComponentRequest {
  messageHistory?: ChatMessage[];
  availableComponents?: AvailableComponents;
  /** Optional threadId to generate a component for */
  threadId?: string;
  /** Optional contextKey to generate a component for */
  contextKey?: string;
}
