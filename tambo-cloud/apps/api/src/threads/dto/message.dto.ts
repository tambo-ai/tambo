import { ActionType, ContentPartType, MessageRole } from '@use-hydra-ai/core';
import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { type OpenAI } from 'openai';
import { ComponentDecision } from '../../components/dto/component-decision.dto';

export enum AudioFormat {
  WAV = 'wav',
  MP3 = 'mp3',
}

export class InputAudio {
  data!: string;
  @IsEnum(AudioFormat)
  format!: AudioFormat;
}

export enum ImageDetail {
  Auto = 'auto',
  High = 'high',
  Low = 'low',
}

export class ImageUrl {
  url!: string;
  @IsEnum(ImageDetail)
  detail?: ImageDetail;
}

export class ChatCompletionContentPart {
  @IsEnum(ContentPartType)
  type!: ContentPartType;
  @ValidateIf((o) => o.type === ContentPartType.Text)
  text?: string;
  @ValidateIf((o) => o.type === ContentPartType.ImageUrl)
  image_url?: ImageUrl;
  @ValidateIf((o) => o.type === ContentPartType.InputAudio)
  input_audio?: InputAudio;
}

/** Internal type to make sure that subclasses are aligned on types */
interface InternalThreadMessage {
  role: MessageRole;
  content: ChatCompletionContentPart[];
  metadata?: Record<string, unknown>;
  component?: ComponentDecision;
  actionType?: ActionType;

  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}
export class ThreadMessage implements InternalThreadMessage {
  id!: string;
  @IsEnum(MessageRole)
  role!: MessageRole;
  content!: ChatCompletionContentPart[];
  metadata?: Record<string, unknown>;
  component?: ComponentDecision;
  @IsEnum(ActionType)
  actionType?: ActionType;

  @IsOptional()
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}

export class MessageRequest implements InternalThreadMessage {
  @IsEnum(MessageRole)
  role!: MessageRole;

  @IsNotEmpty()
  content!: ChatCompletionContentPart[];

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  component?: ComponentDecision;

  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @IsOptional()
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}
