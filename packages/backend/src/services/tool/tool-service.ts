import {
  FunctionParameters,
  strictifyJSONSchemaProperties,
  strictifyJSONSchemaProperty,
  UI_TOOLNAME_PREFIX,
} from "@tambo-ai-cloud/core";
import { JSONSchema7 } from "json-schema";
import OpenAI from "openai";
import {
  AvailableComponent,
  ComponentContextToolMetadata,
} from "../../model/component-metadata";
import { ToolRegistry } from "../../systemTools";

export interface TamboToolParameters {
  _tambo_statusMessage: string;
  _tambo_completionStatusMessage: string;
  _tambo_displayMessage: string;
}

// Standard parameters to be added to all tools
export const standardToolParameters: FunctionParameters = {
  type: "object",
  properties: {
    _tambo_displayMessage: {
      type: "string",
      description:
        "A message to be displayed before the tool is called. This should be a natural language response to the previous message to describe what you are about to do. For example, `First, let me <do something>` or 'Great, I can see <something>, let me <do something>'. Get creative, this is what will make the user feel like they are having a conversation with you. You can and should use markdown formatting (code blocks with language specification, bold, lists) when showing examples or code. This is the only message the user will see, so add any text here you want the user to see as a message from you. There is no other general message field.",
    },
    _tambo_statusMessage: {
      type: "string",
      description:
        "A message that will be displayed to the user to explain in a few words what the tool doing, starting with a verb. For example, 'looking for <something>' or 'creating <something>'.",
    },
    _tambo_completionStatusMessage: {
      type: "string",
      description:
        "A message that will be displayed to the user to explain in a few words what the tool has done, to replace the statusMessage when the tool has completed its task. For example, 'looked for <something>' or 'created <something>'",
    },
  },
  required: [
    "_tambo_statusMessage",
    "_tambo_displayMessage",
    "_tambo_completionStatusMessage",
  ],
  additionalProperties: false,
};

// Public functions
export function convertMetadataToTools(
  toolsMetadata: ComponentContextToolMetadata[],
): (OpenAI.Chat.Completions.ChatCompletionTool & { maxCalls?: number })[] {
  return toolsMetadata.map((tool) => {
    const parameters = {
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
              return [parameter.name, { type: "object", ...parameter.schema }];
            } else {
              return [
                parameter.name,
                parameter.schema || { type: parameter.type },
              ];
            }
          }),
        ),
      },
      required: tool.parameters
        .filter((parameter) => parameter.isRequired)
        .map((parameter) => parameter.name),
      additionalProperties: false,
    };

    const fn: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        strict: true,
        parameters: {
          type: "object",
          properties: parameters.properties,
          required: parameters.required,
          additionalProperties: false,
        },
      },
      ...(tool.maxCalls !== undefined && { maxCalls: tool.maxCalls }),
    };
    return fn;
  });
}

export function convertComponentsToUITools(
  components: AvailableComponent[],
  toolNamePrefix: string = UI_TOOLNAME_PREFIX,
): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return components.map(
    (component): OpenAI.Chat.Completions.ChatCompletionTool => ({
      type: "function" as const,
      function: {
        name: `${toolNamePrefix}${component.name}`,
        description: `Show the ${component.name} UI component the user. Here is a description of the component: ${component.description}`,
        strict: true,
        parameters: {
          type: "object",
          properties: getComponentProperties(component),
          required: Object.keys(
            (component.props as JSONSchema7).properties ?? {},
          ),
          additionalProperties: false,
        },
      },
    }),
  );
}

function getComponentProperties(component: AvailableComponent) {
  if (
    !component.props ||
    typeof component.props !== "object" ||
    !("properties" in component.props)
  ) {
    // we don't know what this is, return it as-is
    console.warn("Unknown component prop format in ", component.name);
    return component.props;
  }
  const componentProps = component.props as JSONSchema7;
  const properties = componentProps.properties;

  if (!properties) {
    return {};
  }
  return strictifyJSONSchemaProperties(
    properties,
    Array.isArray(componentProps.required)
      ? componentProps.required
      : Object.keys(properties),
  );
}

export function addParametersToTools(
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  parameters: FunctionParameters,
): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return tools.map((tool) => {
    if (tool.type !== "function") {
      return tool;
    }
    return {
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
              ...(Array.isArray(parameters.required)
                ? parameters.required
                : []),
            ]),
          ),
          additionalProperties: false,
        },
      },
    };
  });
}

/**
 * Filters out any parameters that aren't defined in the original tool schema
 */
export function filterOutStandardToolParameters(
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall,
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  parsedArguments: Record<string, unknown> | null,
): { parameterName: string; parameterValue: unknown }[] | undefined {
  if (!parsedArguments) {
    return undefined;
  }

  // Find the matching tool definition
  const toolDef = tools.find(
    (tool): tool is OpenAI.Chat.Completions.ChatCompletionFunctionTool =>
      tool.type === "function" && tool.function.name === toolCall.function.name,
  );

  // Get the defined parameter names from the tool's schema. Note that the tool might not take any arguments.
  const definedParamNames = Object.keys(
    toolDef?.function.parameters?.properties ?? {},
  );

  // Transform the tool args into array of {parameterName, parameterValue} objects
  return Object.entries(parsedArguments)
    .filter(([name]) => definedParamNames.includes(name))
    .map(([parameterName, parameterValue]) => ({
      parameterName,
      parameterValue,
    }));
}

export function getToolsFromSources(
  allTools: ToolRegistry,
  availableComponents: AvailableComponent[],
) {
  const componentTools = convertComponentsToUITools(
    availableComponents,
    UI_TOOLNAME_PREFIX,
  );
  const originalTools = [
    ...componentTools,
    ...allTools.clientToolsSchema,
    ...allTools.mcpToolsSchema,
  ];
  const strictTools = originalTools.map(
    (tool): OpenAI.Chat.Completions.ChatCompletionTool => {
      if (tool.type === "custom") {
        return tool;
      }

      const parameters = (tool.function.parameters ?? {}) as Record<
        string,
        JSONSchema7
      >;
      const strictTool: OpenAI.Chat.Completions.ChatCompletionTool = {
        ...tool,
        function: {
          ...tool.function,
          parameters: strictifyJSONSchemaProperty(
            parameters,
            true,
          ) as OpenAI.FunctionParameters,
        },
      };
      return strictTool;
    },
  );
  return { originalTools, strictTools };
}
