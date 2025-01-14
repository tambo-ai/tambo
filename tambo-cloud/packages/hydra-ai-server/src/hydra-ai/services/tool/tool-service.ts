import { ChatCompletion } from "openai/resources/chat/completions";
import { ChatCompletionTool } from "token.js";
import { ToolCallRequest } from "../../model/component-choice";
import { ComponentContextToolMetadata } from "../../model/component-metadata";

export class ToolService {
  convertMetadataToTools(
    toolsMetadata: ComponentContextToolMetadata[],
  ): ChatCompletionTool[] {
    return toolsMetadata.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: {
            ...Object.fromEntries(
              tool.parameters.map((parameter) => {
                if (parameter.type === "enum") {
                  return [
                    parameter.name,
                    {
                      type: "string",
                      enum: parameter.enumValues || [],
                    },
                  ];
                } else if (parameter.type === "array") {
                  return [
                    parameter.name,
                    {
                      type: "array",
                      items: { type: parameter.items?.type || "string" },
                    },
                  ];
                } else {
                  return [parameter.name, { type: parameter.type }];
                }
              }),
            ),
          },
          required: tool.parameters
            .filter((parameter) => parameter.isRequired)
            .map((parameter) => parameter.name),
          additionalProperties: false,
        },
      },
    }));
  }

  parseToolCallResponse(response: ChatCompletion): ToolCallRequest {
    if (!response.choices[0].message.tool_calls) {
      throw new Error("No tool calls found in response");
    }

    const toolArgs = JSON.parse(
      response.choices[0].message.tool_calls[0].function.arguments,
    );

    return {
      toolName: response.choices[0].message.tool_calls[0].function.name,
      parameters: Object.entries(toolArgs).map(([key, value]) => ({
        parameterName: key,
        parameterValue: value,
      })),
    };
  }
}
