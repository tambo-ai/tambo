import { ChatMessage as ChatMessageInterface } from '@use-hydra-ai/hydra-ai-server';
import { IsEnum } from 'class-validator';

export enum ChatMessageSender {
  Hydra = 'hydra',
  User = 'user',
}

export class LegacyChatMessage implements ChatMessageInterface {
  @IsEnum(ChatMessageSender)
  sender!: ChatMessageSender;
  message!: string;
  additionalContext?: string;
}
