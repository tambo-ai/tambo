import TamboAI from "@tambo-ai/typescript-sdk";
import { JSONSchema7 } from "json-schema";
import { z } from "zod";
import {
  ComponentContextToolMetadata,
  ComponentRegistry,
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
  const parameters = getParametersFromZodObject(tool.inputSchema);

  return {
    name: tool.name,
    description: tool.description,
    parameters,
  };
};

/**
 *
 */
export const getParametersFromZodObject = (
  inputSchema: z.ZodObject,
): ParameterSpec[] => {
  return Object.entries(inputSchema.shape).map(
    ([_key, param], index): ParameterSpec => {
      const name = `param${index + 1}`;
      const type = param.def.typeName;
      const description = param.description ?? "";
      const isRequired = !param.isOptional();
      const schema = z.toJSONSchema(param);

      return {
        name,
        type,
        description,
        isRequired,
        schema: schema as JSONSchema7,
      };
    },
  );
};
