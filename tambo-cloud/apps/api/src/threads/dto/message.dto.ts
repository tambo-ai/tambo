import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ActionType, ContentPartType, MessageRole } from '@use-hydra-ai/core';
import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { type OpenAI } from 'openai';
import {
  ComponentDecisionV2,
  ToolCallRequestDto,
} from '../../components/dto/component-decision.dto';

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

/** DTO for the content part of a message. This may be safely cast to or from the ChatCompletionContentPart interface. */
@ApiSchema({ name: 'ChatCompletionContentPart' })
export class ChatCompletionContentPartDto {
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
  content: ChatCompletionContentPartDto[];
  metadata?: Record<string, unknown>;
  component?: ComponentDecisionV2;
  actionType?: ActionType;
  toolCallRequest?: ToolCallRequestDto;
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}

@ApiSchema({ name: 'ThreadMessage' })
export class ThreadMessageDto implements InternalThreadMessage {
  id!: string;
  threadId!: string;
  @IsEnum(MessageRole)
  role!: MessageRole;
  content!: ChatCompletionContentPartDto[];
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;
  component?: ComponentDecisionV2;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  componentState?: Record<string, unknown>;
  toolCallRequest?: ToolCallRequestDto;
  @IsEnum(ActionType)
  actionType?: ActionType;

  @IsOptional()
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
  createdAt!: Date;
}

export class MessageRequest implements InternalThreadMessage {
  @IsEnum(MessageRole)
  role!: MessageRole;

  @IsNotEmpty()
  content!: ChatCompletionContentPartDto[];

  @IsOptional()
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;

  @IsOptional()
  component?: ComponentDecisionV2;

  @IsOptional()
  toolCallRequest?: ToolCallRequestDto;

  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @IsOptional()
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];

  @IsOptional()
  toolResponse?: any;
}
