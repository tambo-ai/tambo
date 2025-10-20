import TamboAI from "@tambo-ai/typescript-sdk";
import {
  ComponentContextTool,
  TamboTool,
  TamboToolRegistry,
} from "../model/component-metadata";
import { mapTamboToolToContextTool } from "./registry";

/**
 * Process a message from the thread, invoking the appropriate tool and returning the result.
 * @param message - The message to handle
 * @param toolRegistry - The tool registry
 * @returns The result of the tool call along with the tool definition
 */
export const handleToolCall = async (
  message: TamboAI.Beta.Threads.ThreadMessage,
  toolRegistry: TamboToolRegistry,
  onCallUnregisteredTool?: (
    toolName: string,
    args: TamboAI.ToolCallParameter[],
  ) => Promise<string>,
): Promise<{
  result: string;
  error?: string;
  tamboTool?: TamboTool;
}> => {
  if (!message?.toolCallRequest?.toolName) {
    throw new Error("Tool name is required");
  }

  try {
    const { tool, tamboTool } = findTool(
      message.toolCallRequest.toolName,
      toolRegistry,
    );
    if (!tool) {
      if (onCallUnregisteredTool) {
        const result = await onCallUnregisteredTool(
          message.toolCallRequest.toolName,
          message.toolCallRequest.parameters,
        );
        return {
          result,
        };
      }
      throw new Error(
        `Tool ${message.toolCallRequest.toolName} not found in registry`,
      );
    }
    return {
      result: await runToolChoice(message.toolCallRequest, tool),
      tamboTool,
    };
  } catch (error) {
    console.error("Error in calling tool: ", error);
    return {
      result: `When attempting to call tool ${message.toolCallRequest.toolName} the following error occurred: ${error}. Explain to the user that the tool call failed and try again if needed.`,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const findTool = (
  toolName: string,
  toolRegistry: TamboToolRegistry,
):
  | {
      tool: ComponentContextTool;
      tamboTool: TamboTool;
    }
  | { tool: null; tamboTool: null } => {
  const registryTool = toolRegistry[toolName];

  if (!registryTool) {
    return { tool: null, tamboTool: null };
  }

  const contextTool = mapTamboToolToContextTool(registryTool);
  return {
    tool: {
      getComponentContext: registryTool.tool,
      definition: contextTool,
    },
    tamboTool: registryTool,
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
