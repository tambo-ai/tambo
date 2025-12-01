import {
  ChatCompletionContentPart,
  ContentPartType,
  LegacyComponentDecision,
  MessageRole,
  Resource,
  ThreadMessage,
  ToolCallRequest,
  tryParseJson,
  type ComponentDecisionV2,
} from "@tambo-ai-cloud/core";
import type {
  AssistantModelMessage,
  ModelMessage,
  TextPart,
  ToolCallPart,
  ToolContent,
  ToolResultPart,
  UserContent,
  UserModelMessage,
} from "ai";
import * as mimeTypes from "mime-types";
import { formatFunctionCall, generateAdditionalContext } from "./tools";

/**
 * Directly convert ThreadMessage[] to AI SDK ModelMessage[] format.
 * This bypasses the OpenAI intermediate layer and consolidates all
 * conversion logic in one place.
 *
 * @param messages - Array of ThreadMessages to convert
 * @param isSupportedMimeType - Predicate to check if provider supports a MIME type
 * @returns Array of AI SDK ModelMessages
 */
export function threadMessagesToModelMessages(
  messages: ThreadMessage[],
  isSupportedMimeType: (mimeType: string) => boolean,
): ModelMessage[] {
  // Track which tool call IDs have been responded to (same logic as thread-message-conversion.ts:29-34)
  const respondedToolIds: string[] = messages
    .filter(
      (message) => message.role === MessageRole.Tool && message.tool_call_id,
    )
    .map((message) => message.tool_call_id)
    .filter((id): id is string => id !== undefined);

  // Convert each message, handling all the complex cases
  const modelMessages: ModelMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    switch (message.role) {
      case MessageRole.Tool: {
        const converted = convertToolMessage(message, messages.slice(0, i));
        if (converted) {
          modelMessages.push(converted);
        }
        break;
      }
      case MessageRole.Hydra:
      case MessageRole.Assistant: {
        const converted = convertAssistantMessage(
          message,
          respondedToolIds,
          isSupportedMimeType,
        );
        modelMessages.push(...converted);
        break;
      }
      case MessageRole.User:
      case MessageRole.System: {
        const converted = convertUserOrSystemMessage(
          message,
          isSupportedMimeType,
        );
        modelMessages.push(converted);
        break;
      }
      default: {
        throw new Error(
          `Unknown message role: ${message.role satisfies never}`,
        );
      }
    }
  }

  return modelMessages;
}

/**
 * Convert a tool message to AI SDK ToolResultPart format
 */
function convertToolMessage(
  message: ThreadMessage,
  previousMessages: ThreadMessage[],
): ModelMessage | null {
  if (!message.tool_call_id) {
    console.warn(
      `no tool id in tool message ${message.id}, skipping tool message`,
    );
    return null;
  }

  // Find the tool name from previous messages
  const toolName = findToolNameById(previousMessages, message.tool_call_id);
  if (!toolName) {
    console.warn(
      `Unable to find previous message for tool call ${message.tool_call_id}`,
    );
    return null;
  }

  // Convert content to tool result format
  const content: ToolContent = message.content
    .map((part): ToolResultPart | null => {
      switch (part.type) {
        case ContentPartType.Text:
          return {
            type: "tool-result",
            output: {
              type: "text",
              value: part.text,
            },
            toolCallId: message.tool_call_id!,
            toolName,
          } satisfies ToolResultPart;
        case ContentPartType.ImageUrl:
          return {
            type: "tool-result",
            output: {
              type: "content",
              value: [
                {
                  type: "media",
                  data: part.image_url.url.split(",")[1],
                  mediaType: "image/jpeg",
                },
              ],
            },
            toolCallId: message.tool_call_id!,
            toolName,
          } satisfies ToolResultPart;
        default: {
          console.warn(
            `Unexpected content type in tool message ${
              message.id
            } (tool_call_id=${message.tool_call_id}, toolName=${toolName}): ${
              part.type
            }, skipping`,
          );
          return null;
        }
      }
    })
    .filter((part): part is ToolResultPart => part !== null);

  return {
    role: "tool",
    content,
  } satisfies ModelMessage;
}

/**
 * Find tool name by looking up the tool call ID in previous messages
 * Looks through previous ThreadMessages to find the assistant message that made the tool call
 */
function findToolNameById(
  previousMessages: ThreadMessage[],
  toolCallId: string,
): string | undefined {
  // Search backwards through messages to find the most recent assistant message with this tool call ID
  for (let i = previousMessages.length - 1; i >= 0; i--) {
    const msg = previousMessages[i];
    if (
      (msg.role === MessageRole.Assistant || msg.role === MessageRole.Hydra) &&
      msg.tool_call_id === toolCallId
    ) {
      // Check if this message has a toolCallRequest
      if (msg.toolCallRequest) {
        return msg.toolCallRequest.toolName;
      }
      // Also check component.toolCallRequest for backwards compatibility
      if (msg.component?.toolCallRequest) {
        return msg.component.toolCallRequest.toolName;
      }
    }
  }
  return undefined;
}

/**
 * Convert assistant messages, handling tool calls and component decisions
 * This is the most complex conversion with multiple cases
 */
function convertAssistantMessage(
  message: ThreadMessage,
  respondedToolIds: string[],
  _isSupportedMimeType: (mimeType: string) => boolean,
): ModelMessage[] {
  const toolCallRequest =
    message.toolCallRequest ?? message.component?.toolCallRequest;

  // Case 1: Fake tool call for missing response (backward compatibility)
  // Port from thread-message-conversion.ts:92-112
  if (
    message.tool_call_id &&
    toolCallRequest &&
    !respondedToolIds.includes(message.tool_call_id)
  ) {
    console.warn(
      `tool message ${message.id} not responded to, responding with tool call (${message.tool_call_id})`,
    );

    const toolCalls = formatFunctionCall(toolCallRequest, message.tool_call_id);
    return [
      {
        role: "assistant",
        content: [
          {
            type: "text",
            text: JSON.stringify(toolCalls[0]),
          },
        ],
      } satisfies AssistantModelMessage,
    ];
  }

  // Case 2: Component decision with tool call (fake the component decision)
  // Port from thread-message-conversion.ts:125-175
  if (
    message.tool_call_id &&
    message.component?.componentName &&
    toolCallRequest
  ) {
    const fakeToolCallId = `${message.tool_call_id}-cc`;
    const combinedComponentDecision = combineComponentWithState(
      message.component,
      message.componentState ?? {},
    );

    const fakeDecisionCall = makeFakeDecisionCall(combinedComponentDecision);
    const decisionToolCalls = formatFunctionCall(
      fakeDecisionCall,
      fakeToolCallId,
    );
    const actualToolCalls = formatFunctionCall(
      toolCallRequest,
      message.tool_call_id,
    );

    // formatFunctionCall always returns function-type tool calls, so we can safely access .function
    const decisionCall = decisionToolCalls[0];
    const actualCall = actualToolCalls[0];
    if (decisionCall.type !== "function" || actualCall.type !== "function") {
      throw new Error("Unexpected tool call type");
    }

    // Return 3 messages: decision call, decision response, actual tool call
    return [
      // 1. Component decision tool call
      {
        role: "assistant",
        content: [
          {
            type: "text",
            text: JSON.stringify(combinedComponentDecision),
          },
          {
            type: "tool-call",
            toolCallId: fakeToolCallId,
            toolName: decisionCall.function.name,
            input: tryParseJson(decisionCall.function.arguments),
          } satisfies ToolCallPart,
        ],
      } satisfies AssistantModelMessage,
      // 2. Component decision response
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            output: { type: "text", value: "{}" },
            toolCallId: fakeToolCallId,
            toolName: decisionCall.function.name,
          } satisfies ToolResultPart,
        ],
      } satisfies ModelMessage,
      // 3. Actual tool call
      {
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Now fetch some data",
          },
          {
            type: "tool-call",
            toolCallId: message.tool_call_id,
            toolName: actualCall.function.name,
            input: tryParseJson(actualCall.function.arguments),
          } satisfies ToolCallPart,
        ],
      } satisfies AssistantModelMessage,
    ];
  }

  // Case 3: Regular assistant message with optional tool calls
  const content: (ToolCallPart | { type: "text"; text: string })[] = [];

  // Add text content if present
  if (message.component) {
    const combinedComponent = combineComponentWithState(
      message.component,
      message.componentState ?? {},
    );
    content.push({
      type: "text",
      text: JSON.stringify(combinedComponent),
    });
  } else {
    message.content.forEach((part) => {
      if (part.type === ContentPartType.Text) {
        content.push({ type: "text", text: part.text });
      }
    });
  }

  // Add tool calls if present
  const toolCallId = message.tool_call_id ?? "";
  if (toolCallId && toolCallRequest) {
    const toolCalls = formatFunctionCall(toolCallRequest, toolCallId);
    toolCalls.forEach((call) => {
      if (call.type === "function") {
        content.push({
          type: "tool-call",
          toolCallId: call.id,
          toolName: call.function.name,
          input: tryParseJson(call.function.arguments),
        } satisfies ToolCallPart);
      }
    });
  }

  const assistantMessage: AssistantModelMessage = {
    role: "assistant",
    content,
  };

  // If there's a tool call that hasn't been responded to, add fake response
  if (toolCallId && toolCallRequest && !respondedToolIds.includes(toolCallId)) {
    const toolName = toolCallRequest.toolName;
    return [
      assistantMessage,
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            output: { type: "text", value: "{}" },
            toolCallId,
            toolName,
          } satisfies ToolResultPart,
        ],
      } satisfies ModelMessage,
    ];
  }

  return [assistantMessage];
}

/**
 * Convert user or system messages to AI SDK format
 * Port from thread-message-conversion.ts:282-324 and ai-sdk-client.ts:759-770
 */
function convertUserOrSystemMessage(
  message: ThreadMessage,
  isSupportedMimeType: (mimeType: string) => boolean,
): ModelMessage {
  // System messages are handled specially - they use the convertToModelMessages function
  // which converts system messages to have a "system" role with string content
  if (message.role === MessageRole.System) {
    // Extract text from content parts
    const textContent = message.content
      .filter((part) => part.type === ContentPartType.Text)
      .map((part) => (part as { text: string }).text)
      .join("");

    // Return as system message with string content (matches old behavior)
    return {
      role: "system",
      content: textContent,
    };
  }

  // Generate additional context if present
  const additionalContextPart = generateAdditionalContext(message);

  // Convert content parts to AI SDK UserContent format
  // UserContent is Array<string | TextPart | FilePart | ImagePart>
  const contentParts: Array<Exclude<UserContent[number], string>> = [];

  // Add additional context first
  if (additionalContextPart) {
    contentParts.push({
      type: "text",
      text: additionalContextPart.text,
    });
  }

  // Add <User> wrapper for user messages (port from thread-message-conversion.ts:296-301)
  if (message.role === MessageRole.User) {
    contentParts.push({ type: "text", text: "<User>" });
  }

  // Convert each content part
  message.content.forEach((part) => {
    const converted = convertContentPartToUserContent(
      part,
      isSupportedMimeType,
    );
    if (converted !== null) {
      // Type assertion needed because UserContent includes strings but we know converted is not a string
      contentParts.push(converted as Exclude<UserContent[number], string>);
    }
  });

  // Close </User> wrapper for user messages
  if (message.role === MessageRole.User) {
    contentParts.push({ type: "text", text: "</User>" });
  }

  return {
    role: "user",
    content: contentParts,
  } satisfies UserModelMessage;
}

/**
 * Convert a single content part to AI SDK UserContent format
 * Port from ai-sdk-client.ts:784-877
 */
function convertContentPartToUserContent(
  part: ChatCompletionContentPart,
  isSupportedMimeType: (mimeType: string) => boolean,
): UserContent[number] | null {
  switch (part.type) {
    case ContentPartType.Text:
      return {
        type: "text",
        text: part.text,
      };

    case ContentPartType.ImageUrl:
      if (part.image_url.url) {
        return {
          type: "image",
          image: part.image_url.url,
        };
      }
      return null;

    case ContentPartType.Resource: {
      const resourceData = part.resource;

      // Handle binary resource content (blob)
      if (resourceData.blob) {
        const mimeType =
          resourceData.mimeType ??
          (mimeTypes.lookup(resourceData.uri ?? "") ||
            "application/octet-stream");
        if (isSupportedMimeType(mimeType)) {
          return {
            type: "file",
            mediaType: mimeType,
            data: Buffer.from(resourceData.blob, "base64"),
          };
        } else {
          return makeTextContentFromResource(resourceData);
        }
      }

      // Handle text resource content
      if (resourceData.text) {
        const mimeType =
          resourceData.mimeType ??
          (mimeTypes.lookup(resourceData.uri ?? "") || "text/plain");

        if (isSupportedMimeType(mimeType)) {
          return {
            type: "file",
            mediaType: mimeType,
            data: Buffer.from(resourceData.text),
            filename: resourceData.uri,
          };
        }

        return makeTextContentFromResource(resourceData);
      }
      throw new Error("Resource has no text or blob content");
    }

    case "file": {
      if (!part.file.file_data) {
        throw new Error("File has no file_data");
      }
      const mimeType = part.file.filename
        ? mimeTypes.lookup(part.file.filename) || "application/octet-stream"
        : "application/octet-stream";
      return {
        type: "file",
        mediaType: mimeType,
        data: part.file.file_data,
      };
    }

    case ContentPartType.InputAudio: {
      return {
        type: "file",
        mediaType: `audio/${part.input_audio.format}`,
        data: part.input_audio.data,
      };
    }

    default: {
      // The type system shows this should be unreachable, but we add a runtime check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new Error(`Unexpected content type: ${(part as any).type}`);
    }
  }
}

/**
 * Create text representation of resource with XML-style tags
 * Port from ai-sdk-client.ts:881-922
 */
const nonAttributeKeys = ["text", "blob", "uri", "annotations"];

function makeTextContentFromResource(resourceData: Resource): TextPart {
  const resourceProps = Object.entries(resourceData)
    .filter(([key]) => !nonAttributeKeys.includes(key))
    .map(([key, value]) => {
      if (key === "annotations") {
        return Object.entries(value)
          .filter(([, value]) => typeof value === "string")
          .map(([key, value]) => {
            return `${makeSafeMLKey(key)}="${makeSafeMLValue(value as string)}"`;
          })
          .join(" ");
      }
      if (typeof value !== "string") {
        return null;
      }
      return `${makeSafeMLKey(key)}="${makeSafeMLValue(value)}"`;
    })
    .filter((prop) => prop !== null)
    .join(" ");

  const text = resourceData.text || "";

  // Match original format exactly: newline after opening tag and before closing tag
  return {
    type: "text",
    text: `
<resource ${resourceProps}>
${text}
</resource>
`,
  } satisfies TextPart;
}

function makeSafeMLKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function makeSafeMLValue(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Combine component decision with state
 * Port from thread-message-conversion.ts:244-258
 */
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
    props: component.props ?? {},
  };
}

/**
 * Create fake component decision tool call
 * Port from thread-message-conversion.ts:262-279
 */
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
