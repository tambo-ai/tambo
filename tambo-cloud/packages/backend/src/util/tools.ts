import {
  ChatCompletionContentPart,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";

/**
 * Converts a tool call request to the OpenAI function_call format
 * @param toolCallRequest The tool call request from the component
 * @returns The formatted function call object or undefined if no request
 */
export function formatFunctionCall(
  toolCallRequest: ToolCallRequest,
  toolCallId: string,
): OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
export function formatFunctionCall(
  toolCallRequest: ToolCallRequest | undefined,
  toolCallId: string | undefined,
): OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] | undefined;
export function formatFunctionCall(
  toolCallRequest: ToolCallRequest | undefined,
  toolCallId: string | undefined,
): OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] | undefined {
  if (!toolCallRequest) {
    return undefined;
  }

  return [
    {
      id: toolCallId ?? "",
      type: "function",
      function: {
        name: toolCallRequest.toolName,
        arguments: JSON.stringify(
          Object.fromEntries(
            toolCallRequest.parameters.map((p) => [
              p.parameterName,
              p.parameterValue,
            ]),
          ),
        ),
      },
    },
  ];
}

export function generateAdditionalContext(message: ThreadMessage) {
  let nextContentContext = "";

  if (message.component && !message.actionType) {
    nextContentContext += `<Component>${JSON.stringify(message.component)}</Component>\n\n`;
  }

  if (
    message.additionalContext &&
    Object.keys(message.additionalContext).length > 0
  ) {
    nextContentContext += `<AdditionalContext> The following is additional context provided by the system that you can use when responding to the user: ${JSON.stringify(message.additionalContext)} </AdditionalContext>\n\n`;
  }

  if (nextContentContext) {
    const additionalContextMessage: ChatCompletionContentPart = {
      type: "text",
      text: nextContentContext,
    };
    return additionalContextMessage;
  }
}
