import { ChatCompletionMessageParam } from "@libretto/token.js";
import { ChatMessage } from "../../model/chat-message";

export function chatHistoryToParams(
  messageHistory: ChatMessage[],
): ChatCompletionMessageParam[] {
  return messageHistory.map((message) => ({
    role: ["user", "tool"].includes(message.sender) ? "user" : "assistant",
    content:
      message.message +
      (message.additionalContext
        ? `<System> The following is additional context provided by the system that you can use when responding to the user:  ${message.additionalContext} </System>`
        : ""),
  }));
}
