import { ChatCompletionTool } from "@libretto/token.js";
import { ComponentContextToolMetadata } from "../../model/component-metadata";

// Public functions
export function convertMetadataToTools(
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
              } else if (parameter.type === "object") {
                return [
                  parameter.name,
                  { type: "object", ...parameter.schema },
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
