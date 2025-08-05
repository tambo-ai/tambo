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

/**
 * Get all the available components from the component registry
 * @param componentRegistry - The component registry
 * @param toolRegistry - The tool registry
 * @param toolAssociations - The tool associations
 * @returns The available components
 */
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

/**
 * Get tools from tool registry that are not associated with any component
 * @param toolRegistry - The tool registry
 * @param toolAssociations - The tool associations
 * @returns The tools that are not associated with any component
 */
export const getUnassociatedTools = (
  toolRegistry: TamboToolRegistry,
  toolAssociations: TamboToolAssociations,
): TamboTool[] => {
  return Object.values(toolRegistry).filter((tool) => {
    // Check if the tool's name appears in any of the tool association arrays
    return !Object.values(toolAssociations).flat().includes(tool.name);
  });
};

/**
 * Helper function to convert component props from Zod schema to JSON Schema
 * @param component - The component to convert
 * @returns The converted props
 */
export const convertPropsToJsonSchema = (
  component: RegisteredComponent,
): any => {
  if (!component.props) {
    return component.props;
  }

  // Check if props is a Zod schema (we can't directly check the type, so we check for _def)
  if (component.props._def && typeof component.props.parse === "function") {
    // Use two-step type assertion for safety
    return zodToJsonSchema(component.props as unknown as z.ZodTypeAny);
  }

  return component.props;
};

/**
 * Get a component by name from the component registry
 * @param componentName - The name of the component to get
 * @param componentRegistry - The component registry
 * @returns The component registration information
 */
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

/**
 * Map a Tambo tool to a context tool
 * @param tool - The tool to map
 * @returns The context tool
 */
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
    "type" in schema &&
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
