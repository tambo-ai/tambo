import {
  ChatCompletionContentPart,
  ChatCompletionContentPartComponent,
  ContentPartType,
  isUiToolName,
  MessageRole,
} from "@tambo-ai-cloud/core";
import { MessageRequest } from "../threads/dto/message.dto";
import { V1InputContent } from "./dto/message.dto";
import { schema } from "@tambo-ai-cloud/db";
import {
  V1ContentBlock,
  V1ComponentContentDto,
  V1TextContentDto,
  V1ResourceContentDto,
  V1ToolUseContentDto,
  V1ToolResultContentDto,
} from "./dto/content.dto";
import { V1MessageDto, V1MessageRole } from "./dto/message.dto";
import { V1ThreadDto } from "./dto/thread.dto";

/**
 * Database thread type alias for cleaner function signatures.
 */
export type DbThread = typeof schema.threads.$inferSelect;

/**
 * Database message type alias for cleaner function signatures.
 */
export type DbMessage = typeof schema.messages.$inferSelect;

/**
 * Convert internal message role to V1 role.
 * V1 only supports user, assistant, system (not tool).
 *
 * @throws Error if role is not recognized
 */
export function roleToV1(role: string): V1MessageRole {
  if (role === "user" || role === "assistant" || role === "system") {
    return role;
  }
  // Tool messages become assistant in V1 format per API design
  if (role === "tool") {
    return "assistant";
  }
  // Unknown role - this is unexpected and indicates a data issue
  throw new Error(
    `Unknown message role "${role}". Expected: user, assistant, system, or tool.`,
  );
}

/**
 * Convert a database thread to V1ThreadDto.
 */
export function threadToDto(thread: DbThread): V1ThreadDto {
  return {
    id: thread.id,
    userKey: thread.contextKey ?? undefined,
    runStatus: thread.runStatus,
    currentRunId: thread.currentRunId ?? undefined,
    statusMessage: thread.statusMessage ?? undefined,
    lastRunCancelled: thread.lastRunCancelled ?? undefined,
    lastRunError: thread.lastRunError
      ? {
          code: thread.lastRunError.code,
          message: thread.lastRunError.message,
        }
      : undefined,
    pendingToolCallIds: thread.pendingToolCallIds ?? undefined,
    lastCompletedRunId: thread.lastCompletedRunId ?? undefined,
    metadata: thread.metadata ?? undefined,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
  };
}

/**
 * Options for content conversion.
 */
export interface ContentConversionOptions {
  /**
   * Called when an unknown content type is encountered.
   * `type` is always a string; malformed or non-string types are normalized to
   * a descriptive placeholder.
   */
  onUnknownContentType?: (info: { type: string }) => void;

  /**
   * Called when a known content type is invalid and must be skipped.
   */
  onInvalidContentPart?: (info: { type: string; reason: string }) => void;
}

const defaultContentConversionOptions: Required<ContentConversionOptions> = {
  onUnknownContentType: ({ type }) => {
    throw new Error(`Unknown content part type "${type}"`);
  },
  onInvalidContentPart: () => undefined,
};

function getContentPartType(part: ChatCompletionContentPart): string {
  const type = (part as { type?: unknown }).type;
  return typeof type === "string" ? type : "<non-string type>";
}

/**
 * Convert a single content part to a V1 content block.
 * By default, this throws if an unknown content type is encountered.
 * To skip or log unknown types instead, provide a non-throwing
 * `options.onUnknownContentType` handler.
 */
export function contentPartToV1Block(
  part: ChatCompletionContentPart,
  options?: ContentConversionOptions,
): V1ContentBlock | null {
  const onUnknownContentType =
    options?.onUnknownContentType ??
    defaultContentConversionOptions.onUnknownContentType;

  switch (part.type) {
    case ContentPartType.Text:
    case "text": {
      const textBlock: V1TextContentDto = {
        type: "text",
        text: part.text ?? "",
      };
      return textBlock;
    }
    case ContentPartType.Resource:
    case "resource": {
      const resourceBlock: V1ResourceContentDto = {
        type: "resource",
        resource: part.resource as V1ResourceContentDto["resource"],
      };
      return resourceBlock;
    }
    case ContentPartType.ImageUrl:
    case "image_url": {
      const url = part.image_url?.url;
      if (!url) {
        options?.onInvalidContentPart?.({
          type: "image_url",
          reason: "missing url",
        });
        return null;
      }

      // Convert image_url to resource format for V1
      const resourceBlock: V1ResourceContentDto = {
        type: "resource",
        resource: {
          uri: url,
          mimeType: "image/*",
        },
      };
      return resourceBlock;
    }
    case "component": {
      // Component blocks are stored in the content array and passed through to V1 API.
      // The component state is merged from the message's componentState field.
      // Type narrowing works since we're in the "component" case
      const componentPart =
        part as unknown as ChatCompletionContentPartComponent;
      return {
        type: "component",
        id: componentPart.id,
        name: componentPart.name,
        props: componentPart.props,
        state: componentPart.state,
      };
    }
    default:
      // Notify caller of unknown content type
      onUnknownContentType({ type: getContentPartType(part) });
      return null;
  }
}

/**
 * Convert internal message content to V1 content blocks.
 * Handles OpenAI-style content parts + component decision to V1 unified format.
 *
 * For tool role messages, wraps content in a tool_result block.
 *
 * @throws Error if componentDecision exists with no componentName and no toolCallRequest
 *         (data integrity issue - componentDecision without componentName is only valid
 *         for tool call messages where it stores _tambo_* status messages)
 */
export function contentToV1Blocks(
  message: DbMessage,
  options?: ContentConversionOptions,
): V1ContentBlock[] {
  const blocks: V1ContentBlock[] = [];
  let foundComponentInContent = false;

  // For tool role messages, wrap content in a tool_result block
  if (message.role === "tool" && message.toolCallId) {
    const resultContent: (V1TextContentDto | V1ResourceContentDto)[] = [];
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        const block = contentPartToV1Block(part, options);
        if (block && (block.type === "text" || block.type === "resource")) {
          resultContent.push(block);
        }
      }
    }
    const toolResultBlock: V1ToolResultContentDto = {
      type: "tool_result",
      toolUseId: message.toolCallId,
      content: resultContent,
      isError: message.error ? true : undefined,
    };
    blocks.push(toolResultBlock);
    return blocks; // Tool messages don't have other content types
  }

  // Convert standard content parts (non-tool messages)
  // Including component blocks stored in the content array
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      const block = contentPartToV1Block(part, options);
      if (block) {
        // For component blocks, merge the message's componentState which may be
        // more up-to-date than what's stored in the content array
        if (block.type === "component") {
          foundComponentInContent = true;
          if (message.componentState) {
            block.state = message.componentState;
          }
        }
        blocks.push(block);
      }
    }
  }

  // Backwards compatibility: If no component was found in the content array but
  // componentDecision exists, generate a component block from it. This handles
  // messages created before component blocks were stored in the content array.
  // Tool messages may have componentDecision copied from the assistant message,
  // but we don't want to duplicate the component block - it belongs on the
  // assistant message that decided to render it.
  if (
    !foundComponentInContent &&
    message.componentDecision &&
    message.role !== "tool"
  ) {
    const component = message.componentDecision;
    if (component.componentName) {
      const componentBlock: V1ComponentContentDto = {
        type: "component",
        id: `comp_${message.id}`, // Generate stable ID from message ID
        name: component.componentName,
        props: component.props ?? {},
        state: message.componentState ?? undefined,
      };
      blocks.push(componentBlock);
    } else if (!message.toolCallRequest) {
      // componentDecision without componentName is only valid for tool call messages
      // (where it stores _tambo_* status messages). For non-tool-call messages,
      // this indicates a data integrity issue - but we don't want to fail the
      // entire request over it.
      console.warn(
        `Component decision in message ${message.id} has no componentName. ` +
          `This indicates a data integrity issue.`,
      );
    }
    // If componentName is null but toolCallRequest exists, the componentDecision
    // is being used for _tambo_* status messages, not for rendering a component.
  }

  // Add tool_use content block if present (assistant messages with tool calls)
  // Skip UI tools (show_component_*) - they're internal implementation details
  if (
    message.toolCallRequest &&
    message.toolCallId &&
    !isUiToolName(message.toolCallRequest.toolName)
  ) {
    const toolCallRequest = message.toolCallRequest;
    // Convert parameters array to input object
    const input: Record<string, unknown> = {};
    for (const param of toolCallRequest.parameters) {
      input[param.parameterName] = param.parameterValue;
    }

    // Add _tambo_* display properties from componentDecision if present.
    // These are stored in componentDecision (via LegacyComponentDecision spread)
    // but not typed in ComponentDecisionV2, so we access them with type assertions.
    // The SDK uses these to display status messages during tool execution.
    if (message.componentDecision) {
      const decision = message.componentDecision as unknown as Record<
        string,
        unknown
      >;
      if (typeof decision.statusMessage === "string") {
        input._tambo_statusMessage = decision.statusMessage;
      }
      if (typeof decision.completionStatusMessage === "string") {
        input._tambo_completionStatusMessage = decision.completionStatusMessage;
      }
      // The display message is stored as 'message' in componentDecision
      if (typeof decision.message === "string" && decision.message.trim()) {
        input._tambo_displayMessage = decision.message;
      }
    }

    const toolUseBlock: V1ToolUseContentDto = {
      type: "tool_use",
      id: message.toolCallId,
      name: toolCallRequest.toolName,
      input,
    };
    blocks.push(toolUseBlock);
  }

  return blocks;
}

/**
 * Check if a message is a UI tool response that should be hidden from the V1 API.
 *
 * UI tool responses are automatically generated "Component was rendered" messages
 * for show_component_* tools. They're identified by:
 * - role: "tool"
 * - componentDecision.componentName is present (non-null)
 *
 * These messages are internal implementation details and shouldn't be exposed
 * to API consumers.
 *
 * @returns true if the message should be filtered out
 */
export function isHiddenUiToolResponse(message: DbMessage): boolean {
  return message.role === "tool" && !!message.componentDecision?.componentName;
}

/**
 * Convert a database message to V1MessageDto.
 *
 * @throws Error if role is not recognized
 */
export function messageToDto(
  message: DbMessage,
  options?: ContentConversionOptions,
): V1MessageDto {
  const content = contentToV1Blocks(message, options);

  return {
    id: message.id,
    role: roleToV1(message.role),
    content,
    createdAt: message.createdAt.toISOString(),
    metadata: message.metadata ?? undefined,
    // Only include isCancelled if true (to keep response size minimal)
    isCancelled: message.isCancelled || undefined,
  };
}

/**
 * Input message shape for V1 API conversion.
 * Matches the shape from V1CreateRunDto["message"].
 */
export interface V1InputMessage {
  role: "user";
  content: V1InputContent[];
  metadata?: Record<string, unknown>;
  additionalContext?: Record<string, unknown>;
}

/**
 * Convert V1 input message to internal MessageRequest format.
 *
 * Note: tool_result blocks are filtered out because they are processed
 * separately in startRun and saved as Tool role messages before this
 * conversion happens.
 *
 * @param message - The V1 input message from the API request
 * @returns Internal MessageRequest format for advanceThread
 */
export function convertV1InputMessageToInternal(
  message: V1InputMessage,
): MessageRequest {
  // Filter out tool_result blocks - they're already saved as separate Tool messages
  const nonToolResultContent = message.content.filter(
    (block) => block.type !== "tool_result",
  );

  return {
    role: MessageRole.User,
    content: nonToolResultContent.map((block) => {
      switch (block.type) {
        case "text":
          return {
            type: ContentPartType.Text,
            text: block.text,
          };
        case "resource":
          return {
            type: ContentPartType.Resource,
            resource: block.resource,
          };
        default:
          throw new Error(
            `Unknown content type: ${(block as { type: string }).type}`,
          );
      }
    }),
    additionalContext: message.additionalContext,
  };
}
