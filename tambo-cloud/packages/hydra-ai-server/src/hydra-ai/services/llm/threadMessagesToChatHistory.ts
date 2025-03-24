import {
  ChatCompletionContentPartText,
  ChatCompletionMessageParam,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
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
  const newMessages = messageHistory.flatMap(
    (message): ChatCompletionMessageParam[] => {
      switch (message.role) {
        case MessageRole.Tool:
          return makeToolMessages(message);
        case MessageRole.Hydra:
        case MessageRole.Assistant:
          return makeAssistantMessages(message, respondedToolIds);
        default:
          return makeUserMessages(message);
      }
    },
  );

  return newMessages;
}

function makeToolMessages(
  message: ThreadMessage,
): (ChatCompletionToolMessageParam | ChatCompletionUserMessageParam)[] {
  if (message.tool_call_id) {
    const toolMessage: ChatCompletionToolMessageParam = {
      role: "tool",
      content: message.content as ChatCompletionContentPartText[],
      tool_call_id: message.tool_call_id,
    };
    return [toolMessage];
  }
  console.warn(
    `no tool id in tool message ${message.id} converting to user message`,
  );
  // If there's no tool id the we just call it a user message
  const userToolMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: message.content as ChatCompletionContentPartText[],
  };
  return [userToolMessage];
}
function makeAssistantMessages(
  message: ThreadMessage,
  respondedToolIds: string[],
): (ChatCompletionAssistantMessageParam | ChatCompletionToolMessageParam)[] {
  // if we got a tool call request, but never recorded the original tool call,
  // so we have to fake the response. This is almost certainly some old data in
  // the database (before 3/15/2025)
  if (
    message.tool_call_id &&
    message.component?.toolCallRequest &&
    !respondedToolIds.includes(message.tool_call_id)
  ) {
    console.warn(
      `tool message ${message.id} not responded to, responding with tool call (${message.tool_call_id})`,
    );
    return [
      {
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
      },
    ];
  }

  // We have recorded that we're calling one of the user's tools, but we also
  // store the component decision in the same row in the messages table in the
  // db. Really, this is as a result of two calls: make a decision and then call
  // a tool.
  //
  // For now, we'll fake the tool call request and the choice response, so that
  // the LLM sees a very clear pattern of component decision -> tool call.
  //
  // In the future we should record the component decision as a tool call so we
  // don't have to fake it.
  if (
    message.tool_call_id &&
    message.component?.componentName &&
    message.component?.toolCallRequest
  ) {
    // Note that we have to keep the tool call id short, OpenAI complains if it
    // is more than 46 characters
    const fakeToolCallId = `${message.tool_call_id}-cc`;
    // Messages:
    // 1. simulate the tool call request, which is the component decision
    // 2. the tool call response, which is the system acknowledgement that the
    //    tool call was handled.
    // 3. the next message, which is the actual user tool call response.
    return [
      {
        role: "assistant",
        content: message.content as ChatCompletionContentPartText[],
        tool_calls: formatFunctionCall(
          makeFakeDecisionCall(message.component),
          fakeToolCallId,
        ),
      },
      {
        role: "tool",
        content: [
          {
            type: "text",
            // The "component_decision" tool call response, which is basically
            // just the system acknowledgement that the tool call was handled.
            text: "{}",
          },
        ],
        tool_call_id: fakeToolCallId,
      },
      {
        role: "assistant",
        content: "Now fetch some data",
        tool_calls: formatFunctionCall(
          message.component?.toolCallRequest,
          message.tool_call_id,
        ),
      },
    ];
  }

  // Finally, if there's no tool call id, just return the assistant message
  if (message.tool_call_id) {
    console.warn(
      `no tool call id in assistant message ${message.id}, returning assistant message`,
    );
  }
  const assistantMessage: ChatCompletionAssistantMessageParam = {
    role: "assistant",
    content: message.content as ChatCompletionContentPartText[],
    tool_calls: formatFunctionCall(
      message.component?.toolCallRequest,
      message.tool_call_id,
    ),
  };
  return [assistantMessage];
}

/** This simulates the tool call that the LLM would make to decide which
 * component to use, since we previously recorded this in the message history */
function makeFakeDecisionCall(
  component: LegacyComponentDecision,
): ToolCallRequest {
  return {
    toolName: "decide_component",
    parameters: [
      {
        parameterName: "reasoning",
        parameterValue: component.message,
      },
      {
        parameterName: "decision",
        parameterValue: true,
      },
      {
        parameterName: "component",
        parameterValue: component.componentName,
      },
    ],
  };
}

function makeUserMessages(
  message: ThreadMessage,
): (ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam)[] {
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
  return [
    {
      role: message.role, // either user or system
      content: content,
    },
  ];
}
