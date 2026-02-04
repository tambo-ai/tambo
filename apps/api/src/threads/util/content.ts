import {
  ChatCompletionContentPart,
  ChatCompletionContentPartComponent,
  ContentPartType,
} from "@tambo-ai-cloud/core";
import { ChatCompletionContentPartDto } from "../dto/message.dto";

/**
 * V1 API-specific content types that should be filtered from legacy API responses
 * but preserved when storing to the database.
 */
const V1_CONTENT_TYPES = ["component", "tool_use", "tool_result"] as const;
type V1ContentType = (typeof V1_CONTENT_TYPES)[number];

function isV1ContentType(type: string): type is V1ContentType {
  return V1_CONTENT_TYPES.includes(type as V1ContentType);
}

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
          // Pass through V1-specific content types (component, tool_use, tool_result)
          // These are stored in the DB and used by V1 API but filtered from legacy responses
          if (isV1ContentType(part.type)) {
            return part as unknown as ChatCompletionContentPart;
          }
          console.log("Unknown content part type:", part);
          throw new Error(`Unknown content part type: ${part.type}`);
      }
    })
    .filter((part): part is ChatCompletionContentPart => !!part);
}

/**
 * Convert a string or array of LLM content parts to a serialized content part
 * for legacy (pre-V1) API responses.
 *
 * Filters out V1 API-specific content types (component, tool_use, tool_result)
 * which should not be exposed in legacy API responses. These types are stored in
 * the database for V1 API support but legacy clients expect only standard
 * content types (text, image_url, input_audio, resource).
 */
export function convertContentPartToDto(
  part: ChatCompletionContentPart[] | string,
): ChatCompletionContentPartDto[] {
  if (typeof part === "string") {
    return [{ type: ContentPartType.Text, text: part }];
  }
  // Filter out V1 API-specific content types
  return part.filter(
    (p) => !isV1ContentType(p.type),
  ) as ChatCompletionContentPartDto[];
}

/**
 * Prepare content for database storage.
 *
 * Unlike convertContentPartToDto, this function preserves ALL content types
 * including V1-specific types (component, tool_use, tool_result). These types
 * need to be stored in the database so the V1 API can look them up for
 * operations like component state updates.
 *
 * @returns The content array unchanged, preserving all content types
 */
export function contentPartToDbFormat(
  content: ChatCompletionContentPart[] | string,
): ChatCompletionContentPart[] {
  if (typeof content === "string") {
    return [{ type: ContentPartType.Text, text: content }];
  }
  return content;
}

/**
 * Type guard to check if a content part is a component content block.
 */
export function isComponentContentPart(
  part: ChatCompletionContentPart,
): part is ChatCompletionContentPartComponent {
  return part.type === "component";
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
