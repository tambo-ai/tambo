import OpenAI from "openai";
import { FunctionParameters } from "openai/resources";
import {
  AvailableComponent,
  ComponentContextToolMetadata,
  ComponentPropsMetadata,
} from "../../model/component-metadata";

// Standard parameters to be added to all tools
export const standardToolParameters: FunctionParameters = {
  type: "object",
  properties: {
    statusMessage: {
      type: "string",
      description:
        "a message that will be displayed to the user to explain in a few words what the tool is being used for, starting with a verb. For example, 'looking for <something>' or 'creating <something>'.",
    },
    displayMessage: {
      type: "string",
      description:
        "A message to be displayed before the tool is called. This should be a natural language response to the previous message to describe what you are about to do. For example, `First, let me <do something>` or 'Great, I can see <something>, let me <do something>'. Get creative, this is what will make the user feel like they are having a conversation with you.",
    },
  },
  required: ["statusMessage", "displayMessage"],
  additionalProperties: false,
};

// Public functions
export function convertMetadataToTools(
  toolsMetadata: ComponentContextToolMetadata[],
): OpenAI.Chat.Completions.ChatCompletionTool[] {
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

export function convertComponentsToUITools(
  components: AvailableComponent[],
  toolNamePrefix: string = "show_",
): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return components.map((component) => ({
    type: "function" as const,
    function: {
      name: `${toolNamePrefix}${component.name}`,
      description: `Show the ${component.name} UI component the user. Here is a description of the component: ${component.description}`,
      parameters: {
        type: "object",
        properties:
          typeof component.props === "object" && "properties" in component.props
            ? component.props.properties
            : component.props,
        required: Object.entries(component.props)
          .filter(([_, value]) => (value as ComponentPropsMetadata).isRequired)
          .map(([key]) => key),
        additionalProperties: false,
      },
    },
  }));
}

export const displayMessageTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "showMessage_tambo_internal",
    description:
      "Display a message to the user. Use this when you just want to communicate something or ask for clarification without taking any other action.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
};

export function addParametersToTools(
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  parameters: FunctionParameters,
): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return tools.map((tool) => ({
    ...tool,
    function: {
      ...tool.function,
      parameters: {
        type: "object",
        properties: {
          ...(parameters.properties || {}),
          ...(tool.function.parameters?.properties || {}),
        },
        required: Array.from(
          new Set([
            ...(Array.isArray(tool.function.parameters?.required)
              ? tool.function.parameters.required
              : []),
            ...(Array.isArray(parameters.required) ? parameters.required : []),
          ]),
        ),
        additionalProperties: false,
      },
    },
  }));
}

/**
 * Filters out any parameters that aren't defined in the original tool schema
 */
export function filterOutStandardToolParameters(
  toolCall: { function: { name: string; arguments: string } },
  tools: {
    function: {
      name: string;
      parameters?: {
        properties?: Record<string, unknown>;
        type?: string;
        required?: string[];
      };
    };
  }[],
  parsedArguments: Record<string, unknown> | null,
): { parameterName: string; parameterValue: unknown }[] | undefined {
  if (!parsedArguments) return undefined;

  // Find the matching tool definition
  const toolDef = tools.find(
    (tool) => tool.function.name === toolCall.function.name,
  );

  if (!toolDef?.function?.parameters?.properties) return undefined;

  // Get the defined parameter names from the tool's schema
  const definedParams = Object.keys(toolDef.function.parameters.properties);

  // Transform the tool args into array of {parameterName, parameterValue} objects
  return Object.entries(parsedArguments)
    .filter(([key]) => definedParams.includes(key))
    .map(([parameterName, parameterValue]) => ({
      parameterName,
      parameterValue,
    }));
}
