import type { ITamboBackend } from "@tambo-ai-cloud/backend";
import {
  AsyncQueue,
  ChatCompletionContentPart,
  ContentPartType,
  GenerationStage,
  MCPHandlers,
  MessageRole,
} from "@tambo-ai-cloud/core";
import type { HydraDb } from "@tambo-ai-cloud/db";
import { operations } from "@tambo-ai-cloud/db";
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
        content: [mcpContentToContentPart(m.content)],
      }));
      // add serially for now
      // TODO: add messages in a batch
      for (const m of messages) {
        const message = await operations.addMessage(db, {
          threadId,
          role: m.role as MessageRole,
          content: m.content,
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
      }
      const response = await tamboBackend.llmClient.complete({
        stream: false,
        promptTemplateName: "sampling",
        promptTemplateParams: {},
        messages: messages,
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
function mcpContentToContentPart(
  content: McpContent,
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
      console.warn(`Unknown content type: ${String((content as any)?.type)}`);
      return {
        type: ContentPartType.Text,
        text: `[Unsupported content type: ${String((content as any)?.type)}]`,
      };
  }
}
