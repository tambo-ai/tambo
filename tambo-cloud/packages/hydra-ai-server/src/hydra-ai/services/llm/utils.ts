import { ChatCompletionMessageParam } from "@libretto/token.js";
import { ChatMessage } from "../../model/chat-message";

export function chatHistoryToParams(
  messageHistory: ChatMessage[],
): ChatCompletionMessageParam[] {
  console.log("messageHistory", messageHistory);
  return messageHistory.map((message) => {
    let content = message.message;

    if (message.component && !message.actionType) {
      content += `\n<Component>${JSON.stringify(message.component)}</Component>`;
    }
    if (message.componentState && !message.actionType) {
      content += `\n<ComponentState>${JSON.stringify(message.componentState)}</ComponentState>`;
    }

    if (message.additionalContext) {
      content += `<System> The following is additional context provided by the system that you can use when responding to the user: ${message.additionalContext} </System>`;
    }

    return {
      role: ["user", "tool"].includes(message.sender) ? "user" : "assistant",
      content,
    };
  });
}
