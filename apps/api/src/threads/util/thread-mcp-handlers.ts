import type { ITamboBackend } from "@tambo-ai-cloud/backend";
import {
  AsyncQueue,
  ChatCompletionContentPart,
  ContentPartType,
  GenerationStage,
  MCPHandlers,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import type { HydraDb } from "@tambo-ai-cloud/db";
import { dbMessageToThreadMessage, operations } from "@tambo-ai-cloud/db";
import type {
  EmbeddedResource,
  ResourceLink,
} from "@modelcontextprotocol/sdk/types.js";
import mimeTypes from "mime-types";
import { StreamQueueItem } from "../dto/stream-queue-item";
import { AudioFormat } from "../dto/message.dto";
import { convertContentPartToDto } from "./content";
import { MCP_PARENT_MESSAGE_ID_META_KEY } from "./tool";

export function createMcpHandlers(
  db: HydraDb,
  tamboBackend: ITamboBackend,
  threadId: string,
  queue: AsyncQueue<StreamQueueItem>,
): MCPHandlers {
  return {
    async sampling(e) {
      let parentMessageId = e.params._meta?.[MCP_PARENT_MESSAGE_ID_META_KEY] as
        | string
        | undefined;

      // Fallback: if parentMessageId is not provided, find the last message
      // in the thread that doesn't have a parent
      if (!parentMessageId) {
        parentMessageId = await operations.findLastMessageWithoutParent(
          db,
          threadId,
        );
      }

      const messages = e.params.messages.map((m) => ({
        // Keep original role for storage
        role: m.role,
        // Cast content to "user" to let audio/image content through to
        // ChatCompletionContentPart type system
        content: mcpContentToContentParts(m.content),
      }));
      // add serially for now and collect the saved messages
      // TODO: add messages in a batch
      const savedMessages: ThreadMessage[] = [];
      for (const m of messages) {
        // MCP sampling messages should only be "user" or "assistant" roles
        // Construct the appropriate UnsavedThreadMessage based on role
        const role =
          m.role === "assistant" ? MessageRole.Assistant : MessageRole.User;
        const message = await operations.addMessage(db, threadId, {
          role,
          content: m.content,
          parentMessageId,
        });

        // Convert DBMessage to ThreadMessage (field name mapping)
        savedMessages.push(dbMessageToThreadMessage(message));

        queue.push({
          response: {
            responseMessageDto: {
              id: message.id,
              parentMessageId,
              role: message.role,
              content: convertContentPartToDto(message.content),
              componentState: message.componentState ?? {},
              threadId: message.threadId,
              createdAt: message.createdAt,
            },
            generationStage: GenerationStage.STREAMING_RESPONSE,
            statusMessage: `Streaming response...`,
          },
          aguiEvents: [], // MCP sampling message, no AG-UI events
        });
      }
      // Filter unsupported parts (resource content) for LLM
      const messagesForLLM: ThreadMessage[] = savedMessages.map((m) => ({
        ...m,
        content: m.content.filter((p) => {
          if (p.type === ContentPartType.Resource) {
            console.warn(
              "Filtering out 'resource' content part for provider call",
            );
            return false;
          }
          return true;
        }),
      }));
      const response = await tamboBackend.llmClient.complete({
        stream: false,
        promptTemplateName: "sampling",
        promptTemplateParams: {},
        messages: messagesForLLM,
      });

      // LLM response is always assistant role
      const message = await operations.addMessage(db, threadId, {
        role: MessageRole.Assistant,
        content: [
          {
            type: "text",
            text: response.message.content ?? "",
          },
        ],
        parentMessageId,
      });

      queue.push({
        response: {
          responseMessageDto: {
            id: message.id,
            parentMessageId,
            role: message.role,
            content: convertContentPartToDto(message.content),
            componentState: message.componentState ?? {},
            threadId: message.threadId,
            createdAt: message.createdAt,
          },
          generationStage: GenerationStage.STREAMING_RESPONSE,
          statusMessage: `Streaming response...`,
        },
        aguiEvents: [], // MCP LLM response, no AG-UI events
      });

      return {
        role: response.message.role,
        content: { type: "text", text: response.message.content ?? "" },
        model: tamboBackend.modelOptions.model,
      };
    },
    elicitation(_e) {
      throw new Error("Not implemented yet");
    },
  };
}
type McpContent = Parameters<
  MCPHandlers["sampling"]
>[0]["params"]["messages"][0]["content"];

// Single content item type from SDK (for when content is not an array)
type McpSdkContentItem = Exclude<McpContent, readonly unknown[]>;

/**
 * Extended content item type that includes resource types.
 * The MCP SDK's SamplingMessageContentBlockSchema doesn't include resource types,
 * but MCP servers can still return them at runtime.
 */
type McpContentItem = McpSdkContentItem | ResourceLink | EmbeddedResource;

function isResourceLink(content: McpContentItem): content is ResourceLink {
  return content.type === "resource_link";
}

function isEmbeddedResource(
  content: McpContentItem,
): content is EmbeddedResource {
  return content.type === "resource";
}

function isMcpContentItem(value: unknown): value is McpContentItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("type" in value)) {
    return false;
  }

  return typeof value.type === "string";
}

function mcpContentItemToContentPart(
  content: McpContentItem,
): ChatCompletionContentPart {
  // Check for resource types first using type guards
  if (isResourceLink(content)) {
    // For sampling messages, we don't have serverKey context to prefix URIs.
    // Log warning and return placeholder - proper handling requires architecture changes.
    console.warn(
      "resource_link in sampling message not yet supported - resource will not be fetched",
      { uri: content.uri, name: content.name },
    );
    return {
      type: ContentPartType.Text,
      text: `[Resource link: ${content.name ?? content.uri}]`,
    };
  }

  if (isEmbeddedResource(content)) {
    // Embedded resource - has inline content already
    const resourceContent = content.resource;
    return {
      type: ContentPartType.Resource,
      resource: {
        uri: resourceContent.uri,
        text: "text" in resourceContent ? resourceContent.text : undefined,
        blob: "blob" in resourceContent ? resourceContent.blob : undefined,
        mimeType: resourceContent.mimeType,
      },
    };
  }

  // Handle SDK-defined content types
  switch (content.type) {
    case "text":
      return { type: ContentPartType.Text, text: content.text };

    case "image":
      return {
        type: ContentPartType.ImageUrl,
        image_url: {
          // this is already base64 encoded
          url: `data:${content.mimeType};base64,${content.data}`,
        },
      };

    case "audio": {
      const format = mimeTypes.extension(content.mimeType);
      if (format !== AudioFormat.MP3 && format !== AudioFormat.WAV) {
        console.warn(
          `Unknown audio format: ${content.mimeType}, returning text content`,
        );
        return {
          type: ContentPartType.Text,
          text: "[Audio content not supported]",
        };
      }
      return {
        type: ContentPartType.InputAudio,
        input_audio: {
          // this is already base64 encoded
          data: content.data,
          // has to be "mp3" or "wav"
          format,
        },
      };
    }

    default:
      // Truly unknown content type
      console.warn(`Unknown content type: ${String(content.type)}`);
      return {
        type: ContentPartType.Text,
        text: `[Unsupported content type: ${String(content.type)}]`,
      };
  }
}

function mcpContentToContentParts(
  content: McpContent,
): ChatCompletionContentPart[] {
  const emptyTextPart: ChatCompletionContentPart[] = [
    { type: ContentPartType.Text, text: "" },
  ];

  // MCP SDK 1.24+ allows content to be either a single item or an array
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return emptyTextPart;
    }

    // Filter to valid content items and convert
    // Note: At runtime, MCP servers may return resource types not in the SDK schema
    const validItems: McpContentItem[] = [];
    for (const item of content) {
      if (isMcpContentItem(item)) {
        validItems.push(item);
      } else {
        console.warn("Unexpected MCP content array element", item);
      }
    }

    const parts = validItems.map(mcpContentItemToContentPart);
    return parts.length > 0 ? parts : emptyTextPart;
  }

  if (!isMcpContentItem(content)) {
    console.warn("Unexpected MCP content value", content);
    return emptyTextPart;
  }

  return [mcpContentItemToContentPart(content)];
}
