import TamboAI from "@tambo-ai/typescript-sdk";
import {
  ComponentContextTool,
  TamboToolRegistry,
} from "../model/component-metadata";
import { mapTamboToolToContextTool } from "../util/registry";

export const handleToolCall = async (
  message: TamboAI.Beta.Threads.ThreadMessage,
  toolRegistry: TamboToolRegistry,
  onCallUnregisteredTool?: (
    toolName: string,
    args: TamboAI.ToolCallParameter[],
  ) => Promise<string>,
): Promise<{ result: string; error?: string }> => {
  if (!message?.toolCallRequest?.toolName) {
    throw new Error("Tool name is required");
  }
  try {
    const tool = findTool(message.toolCallRequest.toolName, toolRegistry);
    if (!tool) {
      if (onCallUnregisteredTool) {
        const result = await onCallUnregisteredTool(
          message.toolCallRequest.toolName,
          message.toolCallRequest.parameters,
        );
        return { result };
      }
      throw new Error(
        `Tool ${message.toolCallRequest.toolName} not found in registry`,
      );
    }
    return { result: await runToolChoice(message.toolCallRequest, tool) };
  } catch (error) {
    console.error("Error in calling tool: ", error);
    return {
      result: `When attempting to call tool ${message.toolCallRequest.toolName} the following error occurred: ${error}. Explain to the user that the tool call failed and try again if needed.`,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const findTool = (toolName: string, toolRegistry: TamboToolRegistry) => {
  const registryTool = toolRegistry[toolName];
  if (!registryTool) return null;
  const contextTool = mapTamboToolToContextTool(registryTool);
  return {
    getComponentContext: registryTool.tool,
    definition: contextTool,
  } as ComponentContextTool;
};

const runToolChoice = async (
  toolCallRequest: TamboAI.ToolCallRequest,
  tool: ComponentContextTool,
): Promise<any> => {
  const parameterValues =
    toolCallRequest.parameters?.map((param) => param.parameterValue) ?? [];
  return await tool.getComponentContext(...parameterValues);
};

