import { SystemTools } from "@tambo-ai-cloud/backend";
import {
  ActionType,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import { AdvanceThreadDto } from "../dto/advance-thread.dto";
import { tryParseJson } from "./content";

export function extractToolResponse(message: ThreadMessage): any {
  // TODO: we get back "resource" from MCP servers, but it is not supported yet
  const nonResourceContent = message.content.filter(
    (part) => (part.type as string) !== "resource",
  );
  if (nonResourceContent.every((part) => part.type === "text")) {
    const contentString = nonResourceContent.map((part) => part.text).join("");
    const jsonResponse = tryParseJson(contentString);
    if (jsonResponse) {
      return jsonResponse;
    }
    return contentString;
  }
  return null;
}

export async function callSystemTool(
  systemTools: SystemTools,
  toolCallRequest: ToolCallRequest,
  toolCallId: string,
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
    const result = await toolSource.callTool(toolCallRequest.toolName, params);
    const responseContent =
      typeof result === "string"
        ? [{ type: "text" as const, text: result }]
        : Array.isArray(result.content)
          ? result.content
          : [];

    // TODO: handle cases where MCP server returns *only* resource types
    if (responseContent.length === 0) {
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
  systemTools: SystemTools,
): toolCallRequest is ToolCallRequest {
  return (
    !!toolCallRequest && toolCallRequest.toolName in systemTools.mcpToolSources
  );
}
