import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  ActionType,
  ChatCompletionContentPartUnion,
  ContentPartType,
  InternalThreadMessage,
  MessageRole,
} from "@tambo-ai-cloud/core";
import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";
import { type OpenAI } from "openai";
import {
  ComponentDecisionV2Dto,
  ToolCallRequestDto,
} from "./component-decision.dto";

export enum AudioFormat {
  WAV = "wav",
  MP3 = "mp3",
}

export class InputAudio {
  data!: string;
  @IsEnum(AudioFormat)
  format!: AudioFormat;
}

export enum ImageDetail {
  Auto = "auto",
  High = "high",
  Low = "low",
}

export class ImageUrl {
  url!: string;
  @IsEnum(ImageDetail)
  detail?: ImageDetail;
}

/** DTO for the content part of a message. This may be safely cast to or from the ChatCompletionContentPart interface. */
@ApiSchema({ name: "ChatCompletionContentPart" })
export class ChatCompletionContentPartDto
  implements ChatCompletionContentPartUnion
{
  @IsEnum(ContentPartType)
  type!: ContentPartType;
  @ValidateIf((o) => o.type === ContentPartType.Text)
  text?: string;
  @ValidateIf((o) => o.type === ContentPartType.ImageUrl)
  image_url?: ImageUrl;
  @ValidateIf((o) => o.type === ContentPartType.InputAudio)
  input_audio?: InputAudio;
}

@ApiSchema({ name: "ThreadMessage" })
export class ThreadMessageDto {
  id!: string;
  threadId!: string;
  @IsEnum(MessageRole)
  role!: MessageRole;
  content!: ChatCompletionContentPartDto[];
  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;
  component?: ComponentDecisionV2Dto;
  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  componentState!: Record<string, unknown>;
  toolCallRequest?: ToolCallRequestDto;
  tool_call_id?: string;
  @IsEnum(ActionType)
  actionType?: ActionType;

  @ApiProperty({ required: false, type: String })
  error?: string;

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
    type: "object",
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;

  @IsOptional()
  component?: ComponentDecisionV2Dto;

  @IsOptional()
  toolCallRequest?: ToolCallRequestDto;

  @IsOptional()
  tool_call_id?: string;
  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @IsOptional()
  @ApiProperty({ required: false, type: String })
  error?: string;

  /**
   * @deprecated Put the response in the content instead
   */
  @IsOptional()
  @ApiProperty({
    description: "@deprecated Put the response in the content instead",
  })
  toolResponse?: any;

  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description: "The initial state of the component",
  })
  componentState?: Record<string, unknown>;
}
