import { MessageRole } from '@use-hydra-ai/db';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ComponentDecision } from '../../components/dto/component-decision.dto';

export class MessageRequest {
  @IsEnum(MessageRole)
  role!: MessageRole;

  @IsNotEmpty()
  message!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  component?: ComponentDecision;
}

export class Message {
  id!: string;
  role!: MessageRole;
  content!: string;
  metadata?: Record<string, unknown>;
  component?: ComponentDecision;
}
