import {
  ChatCompletionContentPart,
  ChatCompletionContentPartComponent,
  ContentPartType,
  isUiToolName,
  MessageRole,
  type UnsavedThreadUserMessage,
} from "@tambo-ai-cloud/core";
import { MessageRequest } from "../threads/dto/message.dto";
import { V1InitialContent, V1InputContent } from "./dto/message.dto";
import { schema } from "@tambo-ai-cloud/db";
import {
  V1ContentBlock,
  V1TextContentDto,
  V1ResourceContentDto,
  V1ToolUseContentDto,
  V1ToolResultContentDto,
} from "./dto/content.dto";
import { V1MessageDto, V1MessageRole } from "./dto/message.dto";
import { V1ThreadDto } from "./dto/thread.dto";
import { Logger } from "@nestjs/common";

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
    name: thread.name ?? undefined,
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

/**
 * Extract _tambo_* display properties from componentDecision for tool_use enrichment.
 */
function getTamboDisplayProperties(
  componentDecision: DbMessage["componentDecision"],
): Record<string, string> {
  if (!componentDecision) return {};
  const decision = componentDecision as unknown as Record<string, unknown>;
  const props: Record<string, string> = {};
  if (typeof decision.statusMessage === "string") {
    props._tambo_statusMessage = decision.statusMessage;
  }
  if (typeof decision.completionStatusMessage === "string") {
    props._tambo_completionStatusMessage = decision.completionStatusMessage;
  }
  return props;
}

/**
 * Build a V1 tool_use content block with Tambo display properties merged in.
 */
function buildToolUseBlock(
  id: string,
  name: string,
  input: Record<string, unknown>,
  componentDecision: DbMessage["componentDecision"],
): V1ToolUseContentDto {
  return {
    type: "tool_use",
    id,
    name,
    input: { ...input, ...getTamboDisplayProperties(componentDecision) },
  };
}

function getContentPartType(part: { type?: unknown }): string {
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
 * Handles OpenAI-style content parts to V1 unified format.
 *
 * For tool role messages, wraps content in a tool_result block.
 */
export function contentToV1Blocks(
  message: DbMessage,
  options?: ContentConversionOptions,
): V1ContentBlock[] {
  const blocks: V1ContentBlock[] = [];

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

  // Convert standard content parts (non-tool messages).
  // Including component blocks and V1-specific types stored in the content array.
  // V1 types (tool_use, tool_result) may be present when the content was saved
  // from V1 streaming, and must be preserved in their natural position to
  // maintain interleaved ordering (e.g., text -> tool_use -> text).
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      const partType = getContentPartType(part as { type?: unknown });

      // Handle V1-specific content types stored inline in the DB content array.
      // These are not part of ChatCompletionContentPart, so we handle them
      // before calling contentPartToV1Block.
      if (partType === "tool_use") {
        const toolUsePart = part as unknown as Record<string, unknown>;
        const id = toolUsePart.id;
        const name = toolUsePart.name;
        if (typeof id !== "string" || typeof name !== "string") {
          logger.warn(
            `Skipping malformed tool_use block (id: ${typeof id}, name: ${typeof name})`,
          );
          continue;
        }
        // Skip UI tools (show_component_*), same as the legacy fallback path
        if (isUiToolName(name)) {
          continue;
        }
        const input =
          toolUsePart.input != null &&
          typeof toolUsePart.input === "object" &&
          !Array.isArray(toolUsePart.input)
            ? (toolUsePart.input as Record<string, unknown>)
            : {};
        blocks.push(
          buildToolUseBlock(id, name, input, message.componentDecision),
        );
        continue;
      }

      // Content is already in V1 format since it was stored by V1 streaming;
      // no need to run sub-parts through contentPartToV1Block.
      if (partType === "tool_result") {
        const toolResultPart = part as unknown as {
          toolUseId: string;
          content: (V1TextContentDto | V1ResourceContentDto)[];
          isError?: boolean;
        };
        const toolResultBlock: V1ToolResultContentDto = {
          type: "tool_result",
          toolUseId: toolResultPart.toolUseId,
          content: toolResultPart.content ?? [],
          isError: toolResultPart.isError,
        };
        blocks.push(toolResultBlock);
        continue;
      }

      const block = contentPartToV1Block(part, options);
      if (block) {
        // For component blocks, merge the message's componentState which may be
        // more up-to-date than what's stored in the content array
        if (block.type === "component") {
          if (message.componentState) {
            block.state = message.componentState;
          }
        }
        blocks.push(block);
      }
    }
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
    parentMessageId: message.parentMessageId ?? undefined,
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
 * Initial message shape for V1 thread creation.
 * Supports user, system, and assistant roles for parity with pre-V1 API.
 */
export interface V1InitialMessage {
  role: "user" | "system" | "assistant";
  content: V1InitialContent[];
  metadata?: Record<string, unknown>;
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

/**
 * Convert a V1 input message to an UnsavedThreadUserMessage for direct database insertion.
 * Used for seeding threads with initial messages.
 * @param message - The V1 input message
 * @returns An unsaved user message ready for operations.addMessage()
 */
export function convertV1InputMessageToUnsaved(
  message: V1InputMessage,
): UnsavedThreadUserMessage {
  return {
    role: MessageRole.User,
    content: message.content
      .filter((block) => block.type !== "tool_result")
      .map((block) => {
        switch (block.type) {
          case "text":
            return {
              type: ContentPartType.Text as const,
              text: block.text,
            };
          case "resource":
            return {
              type: ContentPartType.Resource as const,
              resource: block.resource,
            };
          default:
            throw new Error(
              `Unknown content type in initial message: ${(block as { type: string }).type}`,
            );
        }
      }),
    additionalContext: message.additionalContext,
    metadata: message.metadata,
  };
}

const v1RoleToMessageRole: Record<V1InitialMessage["role"], MessageRole> = {
  user: MessageRole.User,
  system: MessageRole.System,
  assistant: MessageRole.Assistant,
};

/**
 * Convert a V1 initial message to a MessageRequest for ThreadsService.createThread.
 * Supports user, system, and assistant roles. Routes through ThreadsService so that
 * system prompt injection, validation, and customInstructions logic apply.
 * @param message - The V1 initial message
 * @returns MessageRequest for ThreadsService consumption
 */
export function convertV1InitialMessageToMessageRequest(
  message: V1InitialMessage,
): MessageRequest {
  return {
    role: v1RoleToMessageRole[message.role],
    content: message.content.map((block) => {
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
            `Unknown content type in initial message: ${(block as { type: string }).type}`,
          );
      }
    }),
    metadata: message.metadata,
  };
}
