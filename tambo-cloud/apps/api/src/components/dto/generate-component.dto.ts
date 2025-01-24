import {
  AvailableComponents,
  ChatMessage,
} from '@use-hydra-ai/hydra-ai-server';

export class GenerateComponentDto {
  messageHistory?: ChatMessage[];
  availableComponents?: AvailableComponents;
  /** Optional threadId to generate a component for */
  threadId?: string;
  /** Optional contextKey to generate a component for */
  contextKey?: string;
}
