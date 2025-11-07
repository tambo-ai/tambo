import { McpToolRegistry } from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ContentPartType,
  LegacyComponentDecision,
  MCPToolCallResult,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import { AdvanceThreadDto } from "../dto/advance-thread.dto";
import { ChatCompletionContentPartDto } from "../dto/message.dto";
import { tryParseJson } from "./content";

export function validateToolResponse(message: ThreadMessage): boolean {
  // TODO: Handle Resource types - MCP servers return resource content parts
  // Need to validate Resource content parts:
  // - Check for required fields (at least one of: uri, text, or blob)
  // - Validate MIME types if present
  // - For large content, ensure it will be stored in S3 before sending to LLM
  const nonResourceContent = message.content.filter((part) => {
    // Do not log here (warn: false previously)
    if (part.type === ContentPartType.Resource) return false;
    return true;
  });
  if (nonResourceContent.length === 0) {
    return false;
  }
  if (nonResourceContent.every((part) => part.type === ContentPartType.Text)) {
    const contentString = nonResourceContent.map((part) => part.text).join("");
    const jsonResponse = tryParseJson(contentString);
    if (jsonResponse) {
      return true;
    }
    return true;
  }
  if (
    nonResourceContent.every((part) => part.type === ContentPartType.ImageUrl)
  ) {
    return true;
  }
  return false;
}

function buildToolResponseContent(
  result: MCPToolCallResult,
): ChatCompletionContentPartDto[] {
  if (typeof result === "string") {
    return [{ type: ContentPartType.Text, text: result }];
  }
  if (Array.isArray(result.content)) {
    return result.content;
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
    const toolSource = systemTools.mcpToolSources[toolCallRequest.toolName];

    const params = Object.fromEntries(
      toolCallRequest.parameters.map((p) => [
        p.parameterName,
        p.parameterValue,
      ]),
    );
    const result = await toolSource.callTool(toolCallRequest.toolName, params, {
      [MCP_PARENT_MESSAGE_ID_META_KEY]: toolCallMessageId,
    });
    const responseContent = buildToolResponseContent(result);

    // TODO: Handle File types - MCP servers can return resource content parts (now "file" type)
    // When processing MCP responses with File content:
    // 1. Check for File content parts in the response
    // 2. For large text/blob content, upload to S3 before proceeding
    // 3. Store file metadata in database
    // 4. Replace large content with S3 URI references
    // 5. Ensure Files are properly validated and sanitized
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
        component: componentDecision,
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
