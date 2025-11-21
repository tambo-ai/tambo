import {
  ChatCompletionContentPart,
  ContentPartType,
} from "@tambo-ai-cloud/core";
import { ChatCompletionContentPartDto } from "../dto/message.dto";

/**
 * Convert a serialized content part to a content part that can be consumed by
 * an LLM.
 *
 * this mostly does runtime validation to make sure that the more tolerant Dto
 * type is converted to the more strict internal type.
 */
export function convertContentDtoToContentPart(
  content: string | ChatCompletionContentPartDto[],
): ChatCompletionContentPart[] {
  if (!Array.isArray(content)) {
    return [{ type: ContentPartType.Text, text: content }];
  }
  return content
    .map((part): ChatCompletionContentPart | null => {
      switch (part.type) {
        case ContentPartType.Text:
          // empty strings are ok, but undefined/null is not
          if (!part.text && typeof part.text !== "string") {
            throw new Error("Text content is required for text type");
          }
          return {
            type: ContentPartType.Text,
            text: part.text,
          };
        case ContentPartType.ImageUrl: {
          if (
            !part.image_url ||
            typeof part.image_url.url !== "string" ||
            part.image_url.url.length === 0
          ) {
            throw new Error(
              "image_url with a non-empty 'url' is required for image_url type",
            );
          }
          return {
            type: ContentPartType.ImageUrl,
            image_url: part.image_url,
          };
        }
        case ContentPartType.InputAudio: {
          if (
            !part.input_audio ||
            typeof part.input_audio.data !== "string" ||
            part.input_audio.data.length === 0
          ) {
            throw new Error(
              "input_audio with base64 'data' is required for input_audio type",
            );
          }
          return {
            type: ContentPartType.InputAudio,
            input_audio: part.input_audio,
          };
        }
        case ContentPartType.Resource: {
          if (!part.resource) {
            throw new Error("resource is required for resource type");
          }
          return {
            type: ContentPartType.Resource,
            resource: part.resource,
          };
        }
        default:
          console.log("Unknown content part type:", part);
          throw new Error(`Unknown content part type: ${part.type}`);
      }
    })
    .filter((part): part is ChatCompletionContentPart => !!part);
}

/**
 * Convert a string or array of LLM content parts to a serialized content part
 */
export function convertContentPartToDto(
  part: ChatCompletionContentPart[] | string,
): ChatCompletionContentPartDto[] {
  if (typeof part === "string") {
    return [{ type: ContentPartType.Text, text: part }];
  }
  return part as ChatCompletionContentPartDto[];
}

/**
 * Try to parse a string as JSON, returning the original string if it is not valid JSON
 */
export function tryParseJson(text: string): any {
  // we are assuming that JSON is only ever an object or an array,
  // so we don't need to check for other types of JSON structures
  if (!text.startsWith("{") && !text.startsWith("[")) {
    return text;
  }
  try {
    return JSON.parse(text);
  } catch (_error) {
    return text;
  }
}
