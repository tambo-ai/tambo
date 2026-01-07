import { McpToolRegistry, unprefixToolName } from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ContentPartType,
  LegacyComponentDecision,
  MCPToolCallResult,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import type {
  AudioContent,
  EmbeddedResource,
  ImageContent,
  ResourceLink,
  TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import mimeTypes from "mime-types";
import { AdvanceThreadDto } from "../dto/advance-thread.dto";
import { ComponentDecisionV2Dto } from "../dto/component-decision.dto";
import { AudioFormat, ChatCompletionContentPartDto } from "../dto/message.dto";

/**
 * Validates that a tool response message has valid content.
 * Accepts text, image, audio, and resource content types.
 * Messages containing any other content type are considered invalid.
 *
 * @returns True if the message has valid content
 */
export function validateToolResponse(message: ThreadMessage): boolean {
  if (message.content.length === 0) {
    return false;
  }

  const allPartsAreValid = message.content.every((part) => {
    return (
      part.type === ContentPartType.Text ||
      part.type === ContentPartType.ImageUrl ||
      part.type === ContentPartType.InputAudio ||
      part.type === ContentPartType.Resource
    );
  });

  if (!allPartsAreValid) {
    return false;
  }

  return true;
}

/**
 * MCP content block type union for tool call results.
 */
type McpContentBlock =
  | TextContent
  | ImageContent
  | AudioContent
  | ResourceLink
  | EmbeddedResource;

/**
 * Convert an MCP content block to our internal ChatCompletionContentPartDto format.
 * Handles text, image, audio, resource_link, and embedded resource types.
 *
 * Resource URIs are prefixed with serverKey (e.g., "github:file:///main.rs") to enable
 * routing to the correct MCP server during the prefetch phase. This prefix is safe to add
 * unconditionally because:
 *
 * 1. This function only processes content from MCPClient.callTool() results
 * 2. callTool() returns results directly from the MCP SDK's Client.callTool()
 * 3. MCP servers return raw MCP-native URIs - they have no knowledge of our serverKey
 *    routing mechanism, which is purely an internal concept
 * 4. The prefix is stripped in createResourceFetcherMap() before calling readResource()
 *
 * @param content - MCP content block from tool call result (always contains raw URIs)
 * @param serverKey - The MCP server key for prefixing resource URIs
 * @returns Internal content part format
 */
function mcpContentBlockToContentPart(
  content: McpContentBlock,
  serverKey: string,
): ChatCompletionContentPartDto {
  switch (content.type) {
    case "text":
      return { type: ContentPartType.Text, text: content.text };

    case "image":
      return {
        type: ContentPartType.ImageUrl,
        image_url: {
          url: `data:${content.mimeType};base64,${content.data}`,
        },
      };

    case "audio": {
      const format = mimeTypes.extension(content.mimeType);
      if (format !== AudioFormat.MP3 && format !== AudioFormat.WAV) {
        console.warn(
          `Unsupported audio format in tool response: ${content.mimeType}`,
        );
        return {
          type: ContentPartType.Text,
          text: "[Audio content not supported]",
        };
      }
      return {
        type: ContentPartType.InputAudio,
        input_audio: {
          data: content.data,
          format,
        },
      };
    }

    case "resource_link":
      // Convert resource_link to Resource with prefixed URI for later fetching
      return {
        type: ContentPartType.Resource,
        resource: {
          uri: `${serverKey}:${content.uri}`,
          name: content.name,
          description: content.description,
          mimeType: content.mimeType,
          annotations: content.annotations
            ? {
                audience: content.annotations.audience,
                priority: content.annotations.priority,
              }
            : undefined,
        },
      };

    case "resource":
      // Embedded resource - already has content inline
      return {
        type: ContentPartType.Resource,
        resource: {
          uri: `${serverKey}:${content.resource.uri}`,
          text: "text" in content.resource ? content.resource.text : undefined,
          blob: "blob" in content.resource ? content.resource.blob : undefined,
          mimeType: content.resource.mimeType,
        },
      };

    default: {
      // Handle unknown types gracefully
      const unknownContent: unknown = content;
      let type = "unknown";
      if (
        unknownContent &&
        typeof unknownContent === "object" &&
        "type" in unknownContent
      ) {
        const maybeType = (unknownContent as Record<string, unknown>).type;
        if (typeof maybeType === "string") {
          type = maybeType;
        }
      }
      console.warn(`Unknown MCP content type in tool response: ${type}`);
      return {
        type: ContentPartType.Text,
        text: `[Unsupported content type: ${type}]`,
      };
    }
  }
}

/**
 * Build response content from an MCP tool call result.
 * Converts MCP content types to our internal format.
 *
 * @param result - The result from calling an MCP tool
 * @param serverKey - The MCP server key for prefixing resource URIs
 * @returns Array of content parts in our internal format
 */
function buildToolResponseContent(
  result: MCPToolCallResult,
  serverKey: string,
): ChatCompletionContentPartDto[] {
  // Handle legacy string result format
  if (typeof result === "string") {
    return [{ type: ContentPartType.Text, text: result }];
  }

  // Handle structured result with content array
  if (Array.isArray(result.content) && result.content.length > 0) {
    return result.content.map((block) =>
      mcpContentBlockToContentPart(block as McpContentBlock, serverKey),
    );
  }

  return [];
}

/**
 * The key to pass in to `_meta` to identify the parent message ID, must be in the form
 * `<prefix>/<keyname>` as per MCP spec.
 */
export const MCP_PARENT_MESSAGE_ID_META_KEY = "tambo.co/parentMessageId";
export async function callSystemTool(
  systemTools: McpToolRegistry,
  toolCallRequest: ToolCallRequest,
  toolCallId: string,
  toolCallMessageId: string,
  componentDecision: LegacyComponentDecision,
  advanceRequestDto: AdvanceThreadDto,
) {
  if (toolCallRequest.toolName in systemTools.mcpToolSources) {
    const toolSourceInfo = systemTools.mcpToolSources[toolCallRequest.toolName];

    const params = Object.fromEntries(
      toolCallRequest.parameters.map((p) => [
        p.parameterName,
        p.parameterValue,
      ]),
    );
    const unprefixedToolName = unprefixToolName(
      toolCallRequest.toolName,
      toolSourceInfo.serverKey,
    );
    const result = await toolSourceInfo.client.callTool(
      unprefixedToolName,
      params,
      {
        [MCP_PARENT_MESSAGE_ID_META_KEY]: toolCallMessageId,
      },
    );
    const responseContent = buildToolResponseContent(
      result,
      toolSourceInfo.serverKey,
    );

    // Note: resource_link content is converted to Resource with prefixed URI.
    // The prefetchAndCacheResources() function will fetch the content later.
    // TODO: For large text/blob content, upload to S3 before proceeding.
    if (responseContent.length === 0) {
      console.warn(
        "No response content found from MCP tool call - may contain only file/resource types that need processing",
        { toolName: toolCallRequest.toolName },
      );
      throw new Error("No response content found");
    }

    const messageWithToolResponse: AdvanceThreadDto = {
      messageToAppend: {
        actionType: ActionType.ToolResponse,
        component: componentDecision as ComponentDecisionV2Dto,
        role: MessageRole.Tool,
        content: responseContent,
        tool_call_id: toolCallId,
      },
      availableComponents: advanceRequestDto.availableComponents,
      contextKey: advanceRequestDto.contextKey,
    };

    return messageWithToolResponse;
  }

  // If we don't have a tool source for the tool call request, return the
  // original request. Callers should probably handle this as an error.
  return advanceRequestDto;
}

/**
 * Determines if a tool call request is a system tool call.
 * @param toolCallRequest - The tool call request to check
 * @param systemTools - The available system tools
 * @returns True if the tool call is a system tool call
 */
export function isSystemToolCall(
  toolCallRequest: ToolCallRequest | undefined,
  systemTools: McpToolRegistry,
): toolCallRequest is ToolCallRequest {
  return (
    !!toolCallRequest && toolCallRequest.toolName in systemTools.mcpToolSources
  );
}
