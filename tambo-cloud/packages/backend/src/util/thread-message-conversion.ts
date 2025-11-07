import {
  ChatCompletionContentPartText,
  ChatCompletionMessageParam,
  ComponentDecisionV2,
  ContentPartType,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import type OpenAI from "openai";
import { formatFunctionCall, generateAdditionalContext } from "./tools";

export function threadMessagesToChatCompletionMessageParam(
  messages: ThreadMessage[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  // as per
  // https://platform.openai.com/docs/guides/function-calling?api-mode=chat#handling-function-calls,
  // if the model responds with a tool call then the user MUST respond to the
  // tool call with a matching id before adding additional messages.
  //
  // As of this moment, the client is not sending back the tool call id in the response,
  // so we have to convert tools to user + assistant messages. These hacks should go away once the client
  // passes the tool call id in the response.
  const respondedToolIds: string[] = messages
    .filter(
      (message) => message.role === MessageRole.Tool && message.tool_call_id,
    )
    .map((message) => message.tool_call_id)
    .filter((id) => id !== undefined);
  const newMessages = messages.flatMap(
    (message): ChatCompletionMessageParam[] => {
      switch (message.role) {
        case MessageRole.Tool: {
          return makeToolMessages(message);
        }
        case MessageRole.Hydra:
        case MessageRole.Assistant: {
          return makeAssistantMessages(message, respondedToolIds);
        }
        default: {
          return makeUserMessages(message);
        }
      }
    },
  );

  return newMessages;
}

function makeToolMessages(
  message: ThreadMessage,
): (
  | OpenAI.Chat.Completions.ChatCompletionToolMessageParam
  | OpenAI.Chat.Completions.ChatCompletionUserMessageParam
)[] {
  if (message.tool_call_id) {
    const toolMessage: OpenAI.Chat.Completions.ChatCompletionToolMessageParam =
      {
        role: "tool",
        content: message.content as ChatCompletionContentPartText[],
        tool_call_id: message.tool_call_id,
      };
    return [toolMessage];
  }
  console.warn(
    `no tool id in tool message ${message.id}, converting to user message`,
  );
  // If there's no tool id the we just call it a user message
  const userToolMessage: OpenAI.Chat.Completions.ChatCompletionUserMessageParam =
    {
      role: "user",
      content: message.content as ChatCompletionContentPartText[],
    };
  return [userToolMessage];
}
function makeAssistantMessages(
  message: ThreadMessage,
  respondedToolIds: string[],
): (
  | OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam
  | OpenAI.Chat.Completions.ChatCompletionToolMessageParam
)[] {
  // Old entries in the db had toolcallrequest in the component decision, but this has since been elevated to its own column/prop
  const toolCallRequest =
    message.toolCallRequest ?? message.component?.toolCallRequest;
  // if we got a tool call request, but never recorded the original tool call,
  // so we have to fake the response. This is almost certainly some old data in
  // the database (before 3/15/2025)
  if (
    message.tool_call_id &&
    toolCallRequest &&
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
              formatFunctionCall(toolCallRequest, message.tool_call_id),
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
    toolCallRequest
  ) {
    // Note that we have to keep the tool call id short, OpenAI complains if it
    // is more than 46 characters
    const fakeToolCallId = `${message.tool_call_id}-cc`;
    // Combine original component decision with the current component state
    const combinedComponentDecision = combineComponentWithState(
      message.component,
      message.componentState ?? {},
    );

    // Messages:
    // 1. simulate the tool call request, which is the component decision
    // 2. the tool call response, which is the system acknowledgement that the
    //    tool call was handled.
    // 3. the next message, which is the actual user tool call response.
    return [
      {
        role: "assistant",
        content: [
          {
            type: "text",
            text: JSON.stringify(combinedComponentDecision),
          },
        ],
        tool_calls: formatFunctionCall(
          makeFakeDecisionCall(combinedComponentDecision),
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
        tool_calls: formatFunctionCall(toolCallRequest, message.tool_call_id),
      },
    ];
  }

  // Finally, if there's no tool call id, just return the assistant message
  if (!message.tool_call_id) {
    console.warn(
      `no tool call id in assistant message ${message.id}, returning assistant message`,
    );
  }
  if (message.component?.componentName) {
    console.warn(
      `assistant message ${message.id} has component name ${message.component.componentName}, returning assistant message`,
    );
  }
  const toolCallId = message.tool_call_id ?? "";
  const toolCalls = makeToolCallWithFakeFallback(message, toolCallId);
  const assistantMessage: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam =
    {
      role: "assistant",
      tool_calls: toolCalls,
      content: message.component
        ? [
            {
              type: "text",
              text: JSON.stringify(
                combineComponentWithState(
                  message.component,
                  message.componentState ?? {},
                ),
              ),
            },
          ]
        : (message.content as ChatCompletionContentPartText[]),
    };
  if (toolCalls && !respondedToolIds.includes(toolCallId)) {
    const userMessage: OpenAI.Chat.Completions.ChatCompletionToolMessageParam =
      {
        role: "tool",
        content: [{ type: "text", text: "{}" }],
        tool_call_id: toolCallId,
      };
    return [assistantMessage, userMessage];
  }
  return [assistantMessage];
}

function makeToolCallWithFakeFallback(
  message: ThreadMessage,
  toolCallId: string,
) {
  if (!message.component || !toolCallId) {
    return undefined;
  }

  if (message.toolCallRequest) {
    return formatFunctionCall(message.toolCallRequest, toolCallId);
  }

  // this shouldn't happen anymore, but just in case
  console.warn("no tool call request, creating fake component decision call");

  const combinedComponent = combineComponentWithState(
    message.component,
    message.componentState ?? {},
  );
  const fakeDecision = makeFakeDecisionCall(combinedComponent);
  return formatFunctionCall(fakeDecision, toolCallId);
}

function combineComponentWithState(
  component: LegacyComponentDecision,
  componentState: Record<string, unknown>,
): ComponentDecisionV2 {
  return {
    ...component,
    componentState: {
      instructions:
        "\nThe following values represent the current internal state of the component attached to this message. These values may have been updated by the user.",
      ...component.componentState,
      ...componentState,
    },
  };
}

/** This simulates the tool call that the LLM would make to decide which
 * component to use, since we previously recorded this in the message history */
function makeFakeDecisionCall(component: ComponentDecisionV2): ToolCallRequest {
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
): (
  | OpenAI.Chat.Completions.ChatCompletionUserMessageParam
  | OpenAI.Chat.Completions.ChatCompletionSystemMessageParam
)[] {
  if (
    message.role === MessageRole.Hydra ||
    message.role === MessageRole.Assistant ||
    message.role === MessageRole.Tool
  ) {
    throw new Error("Tambo messages should not be converted to user messages");
  }
  const additionalContextMessage = generateAdditionalContext(message);

  // TODO: Handle Resource types - filter them out before passing to AI SDK
  // When Resource content parts are properly stored in S3 and converted to appropriate
  // formats (text, image_url, etc.), this filter can be updated to convert instead of remove
  const contentWithoutResources = message.content.filter(
    (p): p is OpenAI.Chat.Completions.ChatCompletionContentPart => {
      if (p.type === ContentPartType.Resource) {
        console.warn("Filtering out 'resource' content part for provider call");
        return false;
      }
      return true;
    },
  );

  // Only wrap text content with <User> tags, preserve other content types as-is
  const wrappedContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] =
    message.role === MessageRole.User
      ? [
          { type: "text", text: "<User>" },
          ...contentWithoutResources,
          { type: "text", text: "</User>" },
        ]
      : contentWithoutResources;

  // Combine additional context (if any) with the wrapped content
  const content = additionalContextMessage
    ? [additionalContextMessage, ...wrappedContent]
    : wrappedContent;

  // user messages support mixed content, system messages only support text
  // Type assertion is safe here because we've filtered out Resource types above
  return [
    message.role === MessageRole.User
      ? {
          role: message.role,
          content: content,
        }
      : {
          role: message.role,
          content: content as ChatCompletionContentPartText[],
        },
  ];
}
