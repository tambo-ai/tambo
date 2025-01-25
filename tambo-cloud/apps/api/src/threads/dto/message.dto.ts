import { MessageRole } from '@use-hydra-ai/db';
import { ComponentDecision } from '@use-hydra-ai/hydra-ai-server';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class MessageDto {
  @IsEnum(MessageRole)
  role!: MessageRole;

  @IsNotEmpty()
  message!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  component?: ComponentDecision;
}
