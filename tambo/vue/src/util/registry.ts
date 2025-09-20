import TamboAI from "@tambo-ai/typescript-sdk";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import {
  ComponentContextToolMetadata,
  ComponentRegistry,
  JSONSchemaLite,
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

export const getUnassociatedTools = (
  toolRegistry: TamboToolRegistry,
  toolAssociations: TamboToolAssociations,
): TamboTool[] => {
  return Object.values(toolRegistry).filter((tool) => {
    return !Object.values(toolAssociations).flat().includes(tool.name);
  });
};

export const convertPropsToJsonSchema = (
  component: RegisteredComponent,
): any => {
  if (!component.props) return component.props;
  if ((component.props as any)._def && typeof (component.props as any).parse === "function") {
    return zodToJsonSchema(component.props as unknown as z.ZodTypeAny);
  }
  return component.props;
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

function isJsonSchema(
  schema: unknown,
): schema is ReturnType<typeof zodToJsonSchema> {
  return (
    typeof schema === "object" &&
    schema !== null &&
    "type" in (schema as any) &&
    typeof (schema as { type: unknown }).type === "string" &&
    (schema as { type: string }).type === "object"
  );
}

const getParametersFromZodFunction = (
  schema: z.ZodFunction<any, any> | JSONSchemaLite,
): ParameterSpec[] => {
  if (isJsonSchema(schema)) {
    return [
      {
        name: "args",
        type: "object",
        description: schema.description ?? "",
        isRequired: true,
        schema: schema,
      },
    ];
  }
  const parameters: z.ZodTuple = schema.parameters();
  return parameters.items.map((param, index): ParameterSpec => {
    const name = `param${index + 1}`;
    const type = getZodBaseType(param);
    const description = (param as any).description ?? "";
    const isRequired = !param.isOptional();
    const schema = zodToJsonSchema(param);
    return { name, type, description, isRequired, schema };
  });
};

const getZodBaseType = (schema: z.ZodTypeAny): string => {
  const typeName = (schema as any)._def.typeName;
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

