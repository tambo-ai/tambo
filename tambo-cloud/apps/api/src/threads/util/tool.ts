import { SystemTools } from "@tambo-ai-cloud/backend";
import {
  ActionType,
  LegacyComponentDecision,
  MessageRole,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import { AdvanceThreadDto } from "../dto/advance-thread.dto";
import { MessageRequest } from "../dto/message.dto";
import { tryParseJson } from "./content";

export function extractToolResponse(message: MessageRequest): any {
  // need to prioritize toolResponse over content, because that is where the API started.
  if (message.toolResponse) {
    return message.toolResponse;
  }
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
  componentDecision: LegacyComponentDecision,
  advanceRequestDto: AdvanceThreadDto,
) {
  const toolSource = systemTools.mcpToolSources[toolCallRequest.toolName];

  const result = await toolSource.callTool(
    toolCallRequest.toolName,
    Object.fromEntries(
      toolCallRequest.parameters.map((p) => [
        p.parameterName,
        p.parameterValue,
      ]),
    ),
  );

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
    },
    additionalContext: advanceRequestDto.additionalContext,
    availableComponents: advanceRequestDto.availableComponents,
    contextKey: advanceRequestDto.contextKey,
  };

  return messageWithToolResponse;
}
