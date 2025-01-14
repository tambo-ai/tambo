import { ChatCompletionMessageParam } from "token.js";
import { ChatMessage } from "../../model/chat-message";

export function chatHistoryToParams(
  messageHistory: ChatMessage[],
): ChatCompletionMessageParam[] {
  return messageHistory.map((message) => ({
    role: message.sender === "user" ? "user" : "system",
    content: message.message,
  }));
}
