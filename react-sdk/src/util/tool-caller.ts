import TamboAI from "@tambo-ai/typescript-sdk";
import {
  ComponentContextTool,
  TamboToolRegistry,
} from "../model/component-metadata";
import { mapTamboToolToContextTool } from "./registry";

/**
 * Process a message from the thread, invoking the appropriate tool and returning the result.
 * @param message - The message to handle
 * @param toolRegistry - The tool registry
 * @returns The result of the tool call
 */
export const handleToolCall = async (
  message: TamboAI.Beta.ThreadMessage,
  toolRegistry: TamboToolRegistry,
) => {
  if (!message?.toolCallRequest?.toolName) {
    throw new Error("Tool name is required");
  }

  try {
    const tool = findTool(message.toolCallRequest.toolName, toolRegistry);
    return await runToolChoice(message.toolCallRequest, tool);
  } catch (error) {
    console.error("Error in calling tool: ", error);
    return `When attempting to call tool ${message.toolCallRequest.toolName} the following error occurred: ${error}. Explain to the user that the tool call failed and try again if needed.`;
  }
};

const findTool = (toolName: string, toolRegistry: TamboToolRegistry) => {
  const registryTool = toolRegistry[toolName];

  if (!registryTool) {
    throw new Error(`Tool ${toolName} not found in registry`);
  }

  const contextTool = mapTamboToolToContextTool(registryTool);
  return {
    getComponentContext: registryTool.tool,
    definition: contextTool,
  };
};

const runToolChoice = async (
  toolCallRequest: TamboAI.ToolCallRequest,
  tool: ComponentContextTool,
): Promise<any> => {
  // Assumes parameters are in the order they are defined in the tool
  const parameterValues =
    toolCallRequest.parameters?.map((param) => param.parameterValue) ?? [];

  return await tool.getComponentContext(...parameterValues);
};
