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
import mimeTypes from "mime-types";
import { AdvanceThreadResponseDto } from "../dto/advance-thread.dto";
import { AudioFormat } from "../dto/message.dto";
import { convertContentPartToDto } from "./content";
import { MCP_PARENT_MESSAGE_ID_META_KEY } from "./tool";

export function createMcpHandlers(
  db: HydraDb,
  tamboBackend: ITamboBackend,
  threadId: string,
  queue: AsyncQueue<AdvanceThreadResponseDto>,
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
        // Have pretend this is "user" to let audio/image content through to
        // ChatCompletionContentPart
        role: m.role as "user",
        content: mcpContentToContentParts(m.content),
      }));
      // add serially for now and collect the saved messages
      // TODO: add messages in a batch
      const savedMessages: ThreadMessage[] = [];
      for (const m of messages) {
        const message = await operations.addMessage(db, {
          threadId,
          role: m.role as MessageRole,
          content: m.content,
          parentMessageId,
        });

        // Convert DBMessage to ThreadMessage (field name mapping)
        savedMessages.push(dbMessageToThreadMessage(message));

        queue.push({
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

      const message = await operations.addMessage(db, {
        threadId,
        role: response.message.role as MessageRole,
        content: [
          {
            type: "text",
            text: response.message.content ?? "",
          },
        ],
        parentMessageId,
      });

      queue.push({
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

// Single content item type (for when content is not an array)
type McpContentItem = Exclude<McpContent, readonly unknown[]>;

function isMcpContentItem(value: unknown): value is McpContentItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("type" in value)) {
    return false;
  }

  const { type } = value as { type?: unknown };

  return typeof type === "string";
}

function mcpContentItemToContentPart(
  content: McpContentItem,
): ChatCompletionContentPart {
  switch (content.type) {
    case "text":
      return { type: ContentPartType.Text, text: content.text };
    case "image":
      // TODO: convert from image to image url?
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
      // content is `never` at this point, but we don't want to fully break
      // the app, so we just return a text content part with a warning
      console.warn(
        `Unknown content type: ${String((content as { type?: unknown })?.type)}`,
      );
      return {
        type: ContentPartType.Text,
        text: `[Unsupported content type: ${String((content as { type?: unknown })?.type)}]`,
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

    const parts = content
      .filter((item): item is McpContentItem => {
        if (!isMcpContentItem(item)) {
          console.warn("Unexpected MCP content array element", item);
          return false;
        }
        return true;
      })
      .map(mcpContentItemToContentPart);

    return parts.length > 0 ? parts : emptyTextPart;
  }

  if (!isMcpContentItem(content)) {
    console.warn("Unexpected MCP content value", content);
    return emptyTextPart;
  }

  return [mcpContentItemToContentPart(content)];
}
