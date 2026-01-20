import TamboAI from "@tambo-ai/typescript-sdk";
import {
  ComponentContextTool,
  TamboTool,
  TamboToolRegistry,
} from "../model/component-metadata";
import { mapTamboToolToContextTool } from "./registry";

/**
 * Process a message from the thread, invoking the appropriate tool and returning the result.
 * @param toolCallRequest - The message to handle
 * @param toolRegistry - The tool registry
 * @returns The result of the tool call along with the tool definition
 */
export const handleToolCall = async (
  toolCallRequest: TamboAI.ToolCallRequest,
  toolRegistry: TamboToolRegistry,
  onCallUnregisteredTool?: (
    toolName: string,
    args: TamboAI.ToolCallParameter[],
  ) => Promise<string>,
): Promise<{
  result: unknown;
  error?: string;
  tamboTool?: TamboTool;
}> => {
  if (!toolCallRequest?.toolName) {
    throw new Error("Tool name is required");
  }

  try {
    const { tool, tamboTool } = findTool(
      toolCallRequest.toolName,
      toolRegistry,
    );
    if (!tool) {
      if (onCallUnregisteredTool) {
        const result = await onCallUnregisteredTool(
          toolCallRequest.toolName,
          toolCallRequest.parameters,
        );
        return {
          result,
        };
      }
      throw new Error(`Tool ${toolCallRequest.toolName} not found in registry`);
    }
    return {
      result: await runToolChoice(toolCallRequest, tool),
      tamboTool,
    };
  } catch (error) {
    console.error("Error in calling tool: ", error);
    return {
      result: `When attempting to call tool ${toolCallRequest.toolName} the following error occurred: ${error}. Explain to the user that the tool call failed and try again if needed.`,
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
): Promise<unknown> => {
  const parameters = toolCallRequest.parameters ?? [];

  // Reconstruct the object from parameter name-value pairs
  const inputObject = Object.fromEntries(
    parameters.map((param) => [param.parameterName, param.parameterValue]),
  );
  return await tool.getComponentContext(inputObject);
};
