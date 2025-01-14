import {
  AvailableComponents,
  ChatMessage,
} from '@use-hydra-ai/hydra-ai-server';

export class GenerateComponentDto {
  messageHistory?: ChatMessage[];
  availableComponents?: AvailableComponents;
}
