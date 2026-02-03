import {
  ContentPartType,
  ChatCompletionContentPart,
  MessageRole,
} from "@tambo-ai-cloud/core";
import { MessageRequest } from "../threads/dto/message.dto";
import { V1InputContent } from "./dto/message.dto";
import { schema } from "@tambo-ai-cloud/db";
import { Logger } from "@nestjs/common";
import {
  V1ContentBlock,
  V1ComponentContentDto,
  V1TextContentDto,
  V1ResourceContentDto,
  V1ToolUseContentDto,
} from "./dto/content.dto";
import { V1MessageDto, V1MessageRole } from "./dto/message.dto";
import { V1ThreadDto } from "./dto/thread.dto";

const logger = new Logger("V1Conversions");

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
 * If componentDecision exists but has no componentName, logs a warning and
 * skips the component block (data integrity issue from legacy data).
 */
export function contentToV1Blocks(
  message: DbMessage,
  options?: ContentConversionOptions,
): V1ContentBlock[] {
  const blocks: V1ContentBlock[] = [];

  // Convert standard content parts
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      const block = contentPartToV1Block(part, options);
      if (block) {
        blocks.push(block);
      }
    }
  }

  // Add component content block if present (only for assistant messages)
  // Tool messages may have componentDecision copied from the assistant message,
  // but we don't want to duplicate the component block - it belongs on the
  // assistant message that decided to render it.
  if (message.componentDecision && message.role !== "tool") {
    const component = message.componentDecision;
    if (!component.componentName) {
      // Log warning for data integrity issue but don't break the response
      logger.warn(
        `Component decision in message ${message.id} has no componentName. ` +
          `Skipping component block. This indicates a data integrity issue.`,
      );
    } else {
      const componentBlock: V1ComponentContentDto = {
        type: "component",
        id: `comp_${message.id}`, // Generate stable ID from message ID
        name: component.componentName,
        props: component.props ?? {},
        state: message.componentState ?? undefined,
      };
      blocks.push(componentBlock);
    }
  }

  // Add tool_use content block if present (assistant messages with tool calls)
  if (message.toolCallRequest && message.toolCallId) {
    const toolCallRequest = message.toolCallRequest;
    // Convert parameters array to input object
    const input: Record<string, unknown> = {};
    for (const param of toolCallRequest.parameters) {
      input[param.parameterName] = param.parameterValue;
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
