import TamboAI from "@tambo-ai/typescript-sdk";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import {
  ComponentContextToolMetadata,
  ComponentRegistry,
  ParameterSpec,
  RegisteredComponent,
  TamboTool,
  TamboToolAssociations,
  TamboToolRegistry,
} from "../model/component-metadata";

export const getAvailableComponents = (
  componentRegistry: ComponentRegistry,
  toolRegistry: TamboToolRegistry,
  toolAssociations: TamboToolAssociations,
): TamboAI.AvailableComponent[] => {
  const availableComponents: TamboAI.AvailableComponent[] = [];

  for (const [name, componentEntry] of Object.entries(componentRegistry)) {
    const associatedToolNames = toolAssociations[name] || [];

    const contextTools = [
      ...associatedToolNames.map((toolName) => {
        const tool = toolRegistry[toolName];
        if (!tool) return null;
        return mapTamboToolToContextTool(tool);
      }),
    ].filter((tool): tool is ComponentContextToolMetadata => tool !== null);

    availableComponents.push({
      name: componentEntry.name,
      description: componentEntry.description,
      props: componentEntry.props,
      contextTools,
    });
  }

  return availableComponents;
};

export const getComponentFromRegistry = (
  componentName: string,
  componentRegistry: ComponentRegistry,
): RegisteredComponent => {
  const componentEntry = componentRegistry[componentName];

  if (!componentEntry) {
    throw new Error(
      `Tambo tried to use Component ${componentName}, but it was not found.`,
    );
  }

  return componentEntry;
};

export const getDefaultContextAdditions = (): string[] => {
  const utcOffsetHours = new Date().getTimezoneOffset() / 60;
  const utcOffset = `(UTC${utcOffsetHours > 0 ? "+" : ""}${utcOffsetHours})`;
  return [
    `The current time in user's timezone (${utcOffset}) is: ${new Date().toLocaleString()}`,
  ];
};

export const getClientContext = (): string => {
  const contextAdditions = getDefaultContextAdditions();
  return contextAdditions.join("\n");
};

export const mapTamboToolToContextTool = (
  tool: TamboTool,
): ComponentContextToolMetadata => {
  const parameters = getParametersFromZodFunction(tool.toolSchema);

  return {
    name: tool.name,
    description: tool.description,
    parameters,
  };
};

const getParametersFromZodFunction = (
  schema: z.ZodFunction<any, any>,
): ParameterSpec[] => {
  const parameters: z.ZodTuple = schema.parameters();
  return parameters.items.map((param, index): ParameterSpec => {
    const name = `param${index + 1}`;
    const type = getZodBaseType(param);
    const description = param.description ?? "";
    const isRequired = !param.isOptional();
    const schema = zodToJsonSchema(param);

    return {
      name,
      type,
      description,
      isRequired,
      schema,
    };
  });
};

const getZodBaseType = (schema: z.ZodTypeAny): string => {
  const typeName = schema._def.typeName;
  switch (typeName) {
    case "ZodString":
      return "string";
    case "ZodNumber":
      return "number";
    case "ZodBoolean":
      return "boolean";
    case "ZodArray":
      return "array";
    case "ZodEnum":
      return "enum";
    case "ZodDate":
      return "date";
    case "ZodObject":
      return "object";
    default:
      console.warn("falling back to string for", typeName);
      return "string";
  }
};
