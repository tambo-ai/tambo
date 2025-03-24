import { ApiSchema } from "@nestjs/swagger";
import { ChatMessage } from "@tambo-ai-cloud/hydra-ai-server";
import { IsEnum } from "class-validator";

export enum ChatMessageSender {
  Hydra = "hydra",
  User = "user",
  Tool = "tool",
}

@ApiSchema({ name: "LegacyChatMessage" })
export class LegacyChatMessageDto implements ChatMessage {
  @IsEnum(ChatMessageSender)
  sender!: ChatMessageSender;
  message!: string;
  additionalContext?: string;
}
