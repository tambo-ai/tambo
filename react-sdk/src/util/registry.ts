import TamboAI from "@tambo-ai/typescript-sdk";
import {
  ComponentContextToolMetadata,
  ComponentRegistry,
  DefineToolFn,
  RegisteredComponent,
  TamboTool,
  TamboToolAssociations,
  TamboToolRegistry,
} from "../model/component-metadata";
import {
  getParametersFromToolSchema,
  isStandardSchema,
  schemaToJsonSchema,
} from "../schema";

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

    const contextTools = associatedToolNames
      .map((toolName) => {
        const tool = toolRegistry[toolName];
        if (!tool) return null;
        return mapTamboToolToContextTool(tool);
      })
      .filter((tool): tool is ComponentContextToolMetadata => tool !== null);

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
 * Helper function to convert component props from Standard Schema or JSON Schema
 * @param component - The component to convert
 * @returns The converted props as JSON Schema
 */
export const convertPropsToJsonSchema = (
  component: RegisteredComponent,
): unknown => {
  if (!component.props) {
    return component.props;
  }

  // Check if props is a Standard Schema (Zod, Valibot, ArkType, etc.)
  if (isStandardSchema(component.props)) {
    return schemaToJsonSchema(component.props);
  }

  // Already JSON Schema or unknown format - return as-is
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
  const parameters = getParametersFromToolSchema(tool);

  return {
    name: tool.name,
    description: tool.description,
    parameters,
    ...("maxCalls" in tool && tool.maxCalls !== undefined
      ? { maxCalls: tool.maxCalls }
      : {}),
    ...("annotations" in tool && tool.annotations !== undefined
      ? { annotations: tool.annotations }
      : {}),
  };
};

/**
 * Provides type safety for defining a Tambo Tool.
 *
 * Tambo uses the [standard-schema.dev](https://standard-schema.dev) spec which means you can use any Standard Schema
 * compliant validator (Zod, Valibot, ArkType, etc.). This ensures the tool function args and output types are correctly
 * inferred from the provided schemas.
 * @example
 * ```typescript
 * import { z } from "zod/v4";
 *
 * const myTool = defineTamboTool({
 *   // ...
 * });
 * ```
 * @param tool The tool definition to register
 * @returns The registered tool definition
 */
export const defineTool: DefineToolFn = (tool: any) => {
  if ("toolSchema" in tool) {
    return tool;
  }
  tool.inputSchema ??= { type: "object", properties: {}, required: [] };
  tool.outputSchema ??= { type: "object", properties: {}, required: [] };
  return tool;
};
