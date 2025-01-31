import { ChatCompletionMessageParam } from "token.js";
import { ChatMessage } from "../../model/chat-message";

export function chatHistoryToParams(
  messageHistory: ChatMessage[],
): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [];

  messageHistory.forEach((message) => {
    messages.push({
      role: message.sender === "user" ? "user" : "system",
      content:
        message.message +
        (message.additionalContext
          ? `<System> The following is additional context provided by the system that you can use when responding to the user:  ${message.additionalContext} </System>`
          : ""),
    });
  });

  return messages;
}
