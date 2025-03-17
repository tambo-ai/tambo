import {
  ChatCompletionContentPart,
  ChatCompletionContentPartText,
  ChatCompletionMessageParam,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources";

/**
 * Converts a tool call request to the OpenAI function_call format
 * @param toolCallRequest The tool call request from the component
 * @returns The formatted function call object or undefined if no request
 */
function formatFunctionCall(
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

export function chatHistoryToParams(
  messageHistory: ThreadMessage[],
): ChatCompletionMessageParam[] {
  // as per
  // https://platform.openai.com/docs/guides/function-calling?api-mode=chat#handling-function-calls,
  // if the model responds with a tool call then the user MUST respond to the
  // tool call with a matching id before adding additional messages.
  //
  // As of this moment, the client is not sending back the tool call id in the response,
  // so we have to convert tools to user + assistant messages. These hacks should go away once the client
  // passes the tool call id in the response.
  const respondedToolIds: string[] = messageHistory
    .filter(
      (message) => message.role === MessageRole.Tool && message.tool_call_id,
    )
    .map((message) => message.tool_call_id)
    .filter((id) => id !== undefined);
  const newMessages = messageHistory.map(
    (message): ChatCompletionMessageParam => {
      // Tool response
      if (message.role === MessageRole.Tool) {
        if (message.tool_call_id) {
          const toolMessage: ChatCompletionToolMessageParam = {
            role: "tool",
            content: message.content as ChatCompletionContentPartText[],
            tool_call_id: message.tool_call_id,
          };
          return toolMessage;
        }
        console.warn(
          `no tool id in tool message ${message.id} converting to user message`,
        );
        // If there's no tool id the we just call it a user message
        const userToolMessage: ChatCompletionUserMessageParam = {
          role: "user",
          content: message.content as ChatCompletionContentPartText[],
        };
        return userToolMessage;
      }
      if (
        message.role === MessageRole.Hydra ||
        message.role === MessageRole.Assistant
      ) {
        // if we got a tool call request, but not the id, then we have to fake the response
        if (
          message.tool_call_id &&
          !respondedToolIds.includes(message.tool_call_id)
        ) {
          console.warn(
            `tool message ${message.id} not responded to, responding with tool call (${message.tool_call_id})`,
          );
          return {
            role: "assistant",
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  formatFunctionCall(
                    message.component?.toolCallRequest,
                    message.tool_call_id,
                  ),
                ),
              },
            ],
          };
        }
        const assistantMessage: ChatCompletionAssistantMessageParam = {
          role: "assistant",
          content: message.content as ChatCompletionContentPartText[],
          tool_calls: formatFunctionCall(
            message.component?.toolCallRequest,
            message.tool_call_id,
          ),
        };
        return assistantMessage;
      }

      const additionalContextMessage = generateAdditionalContext(message);

      const content: ChatCompletionContentPartText[] = additionalContextMessage
        ? [
            ...(message.content as ChatCompletionContentPartText[]),
            additionalContextMessage,
          ]
        : (message.content as ChatCompletionContentPartText[]);
      return {
        role: message.role, // either user or system
        content: content,
      };
    },
  );

  return newMessages;
}
function generateAdditionalContext(message: ThreadMessage) {
  let nextContentContext = "";

  if (message.component && !message.actionType) {
    nextContentContext += `\n<Component>${JSON.stringify(message.component)}</Component>`;
  }
  if (
    Object.keys(message.componentState ?? {}).length > 0 &&
    !message.actionType
  ) {
    nextContentContext += `\n<ComponentState>${JSON.stringify(message.componentState)}</ComponentState>`;
  }

  if (message.additionalContext) {
    nextContentContext += `<System> The following is additional context provided by the system that you can use when responding to the user: ${message.additionalContext} </System>`;
  }

  if (nextContentContext) {
    const additionalContextMessage: ChatCompletionContentPart = {
      type: "text",
      text: nextContentContext,
    };
    return additionalContextMessage;
  }
}
