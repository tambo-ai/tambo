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

  @ApiProperty({
    description: `The id of the parent message, if the message was created during the 
generation of another message, such as during an agent call, MCP Elicitation, or MCP Sample`,
  })
  parentMessageId?: string;
  content!: ChatCompletionContentPartDto[];
  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;
  component?: ComponentDecisionV2Dto;
  @ApiProperty({
    description: "Reasoning text from the LLM, if the model supports it.",
  })
  reasoning?: string[];

  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  componentState!: Record<string, unknown>;

  @ApiProperty({
    description:
      "The tool call request. This is filled in only if the tool call is a client-side tool call.",
  })
  toolCallRequest?: ToolCallRequestDto;
  @ApiProperty({
    description:
      "The unique id of the tool call. This is filled in only if the tool call is a client-side tool call.",
  })
  tool_call_id?: string;

  /**
   * @deprecated Use the role and the presence of tool calls to determine the action type
   */
  @IsEnum(ActionType)
  @ApiProperty({
    deprecated: true,
    description:
      "Deprecated: use the role and the presence of tool calls to determine the action type",
  })
  actionType?: ActionType;

  @ApiProperty({ required: false, type: String })
  error?: string;

  @ApiProperty({
    required: false,
    type: Boolean,
    description: "Whether the message has been cancelled",
  })
  isCancelled?: boolean;

  @IsOptional()
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
  createdAt!: Date;

  @IsOptional()
  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description:
      "Additional context to provide to the AI beyond the user query, such as the info about the current page the user is visiting.",
  })
  additionalContext?: Record<string, any>;
}

export class MessageRequest implements InternalThreadMessage {
  @IsEnum(MessageRole)
  role!: MessageRole;

  @IsNotEmpty()
  content!: ChatCompletionContentPartDto[];

  @IsOptional()
  @ApiProperty({
    type: "array",
    items: { type: "string" },
    description: "Reasoning text from the LLM, if the model supports it.",
  })
  reasoning?: string[];

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

  /**
   * @deprecated Use the role and the presence of tool calls to determine the action type
   */
  @IsOptional()
  @IsEnum(ActionType)
  @ApiProperty({
    deprecated: true,
    description:
      "No longer used - instead set role and the tool call information",
  })
  actionType?: ActionType;

  @IsOptional()
  @ApiProperty({ required: false, type: String })
  error?: string;

  @IsOptional()
  @ApiProperty({
    required: false,
    type: Boolean,
    description: "Whether the message has been cancelled",
  })
  isCancelled?: boolean;

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

  @IsOptional()
  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description:
      "Additional context to provide to the AI beyond the user query, such as the info about the current page the user is visiting.",
  })
  additionalContext?: Record<string, any>;
}
