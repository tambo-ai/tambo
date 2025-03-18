import {
  ChatCompletionContentPartText,
  ChatCompletionMessageParam,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources";
import { formatFunctionCall, generateAdditionalContext } from "./utils";

export function threadMessagesToChatHistory(
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
      switch (message.role) {
        case MessageRole.Tool:
          return makeToolMessage(message);
        case MessageRole.Hydra:
        case MessageRole.Assistant:
          return makeAssistantMessage(message, respondedToolIds);
        default:
          return makeUserMessage(message);
      }
    },
  );

  return newMessages;
}

function makeToolMessage(
  message: ThreadMessage,
): ChatCompletionToolMessageParam | ChatCompletionUserMessageParam {
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
function makeAssistantMessage(
  message: ThreadMessage,
  respondedToolIds: string[],
): ChatCompletionAssistantMessageParam {
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

function makeUserMessage(
  message: ThreadMessage,
): ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam {
  if (
    message.role === MessageRole.Hydra ||
    message.role === MessageRole.Assistant ||
    message.role === MessageRole.Tool
  ) {
    throw new Error("Hydra messages should not be converted to user messages");
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
}
