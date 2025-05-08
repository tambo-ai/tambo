import TamboAI from "@tambo-ai/typescript-sdk";
import { z } from "zod";
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
    // Assert that props is a Zod type with toJSONSchema method
    return z.toJSONSchema(component.props as unknown as z.ZodTypeAny);
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

const getDefaultContextAdditions = (): string[] => {
  const utcOffsetHours = new Date().getTimezoneOffset() / 60;
  const utcOffset = `(UTC${utcOffsetHours > 0 ? "+" : ""}${utcOffsetHours})`;
  return [
    `The current time in user's timezone (${utcOffset}) is: ${new Date().toLocaleString()}`,
  ];
};

/**
 * Get the client context for the current thread, such as the current time in the user's timezone
 * @returns a string of context additions that will be added to the prompt when the thread is advanced.
 */
export const getClientContext = (): string => {
  const contextAdditions = getDefaultContextAdditions();
  return contextAdditions.join("\n");
};

/**
 * Map a Tambo tool to a context tool
 * @param tool - The tool to map
 * @returns The context tool
 */
export const mapTamboToolToContextTool = (
  tool: TamboTool,
): ComponentContextToolMetadata => {
  const parameters = getParameterInfo(tool.toolSchema);

  return {
    name: tool.name,
    description: tool.description,
    parameters,
  };
};

/**
 * Get the parameters from the arguments of a Zod function or JSON Schema
 * @param toolSchema - The Zod function or JSON Schema
 * @returns The parameters
 */
function getParameterInfo(
  toolSchema: z.core.$ZodFunction | JSONSchemaLite,
): ParameterSpec[] {
  if (isJSONSchema(toolSchema)) {
    return [
      {
        name: "args",
        type: "object",
        description: toolSchema.description ?? "",
        isRequired: true,
        schema: toolSchema,
      },
    ];
  }
  if (!toolSchema._def.input) {
    throw new Error("Input is not defined");
  }

  const input = toolSchema._def.input as z.ZodObject<any>;
  const shape = input.shape;
  const mappedParameters = Object.entries(shape).map(([_key, param], index) => {
    const paramDef = param as z.ZodObject<any>;
    return {
      name: `param${index + 1}`,
      type: paramDef.def.type,
      description: paramDef.description ?? "",
      isRequired: !paramDef.isOptional(),
      schema: z.toJSONSchema(paramDef) as JSONSchemaLite,
    };
  });

  return mappedParameters;
}

function isJSONSchema(
  schema: unknown,
): schema is ReturnType<typeof z.toJSONSchema> {
  return (
    typeof schema === "object" &&
    schema !== null &&
    "type" in schema &&
    typeof (schema as { type: unknown }).type === "string" &&
    (schema as { type: string }).type === "object"
  );
}
