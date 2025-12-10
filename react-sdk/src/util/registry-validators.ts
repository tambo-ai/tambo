import type { TamboComponent, TamboTool } from "../model/component-metadata";
import { getSerializedProps, isZodSchema } from "./schema-utils";
import { assertValidName } from "./validate-component-name";
import { assertNoZodRecord } from "./validate-zod-schema";

/**
 * Validates a tool before registration.
 * Throws an error if the tool is invalid.
 * @param tool - The tool to validate
 */
export function validateTool(tool: TamboTool): void {
  // Validate tool name
  assertValidName(tool.name, "tool");

  // Validate tool schemas - only check if it's a Zod schema
  if (tool.toolSchema && isZodSchema(tool.toolSchema)) {
    assertNoZodRecord(tool.toolSchema, `toolSchema of tool "${tool.name}"`);
  }
}

/**
 * Validates a component and prepares its props for registration.
 * Throws an error if the component is invalid.
 * @param component - The component to validate and prepare
 * @returns Object containing the serialized props
 */
export function validateAndPrepareComponent(component: TamboComponent): {
  props: Record<string, unknown>;
} {
  const { name, propsSchema, propsDefinition } = component;

  // Validate component name
  assertValidName(name, "component");

  // Validate that at least one props definition is provided
  if (!propsSchema && !propsDefinition) {
    throw new Error(
      `Component ${name} must have either propsSchema (recommended) or propsDefinition defined`,
    );
  }

  // Validate that only one props definition is provided
  if (propsSchema && propsDefinition) {
    throw new Error(
      `Component ${name} cannot have both propsSchema and propsDefinition defined. Use only one. We recommend using propsSchema.`,
    );
  }

  // Validate that the propsSchema does not include z.record()
  if (propsSchema && isZodSchema(propsSchema)) {
    assertNoZodRecord(propsSchema, `propsSchema of component "${name}"`);
  }

  // Convert propsSchema to JSON Schema if it exists
  const props = getSerializedProps(propsDefinition, propsSchema, name);

  return { props };
}

/**
 * Validates a tool association between a component and tool.
 * Throws an error if the association is invalid.
 * @param componentName - The component name
 * @param toolName - The tool name
 * @param componentExists - Whether the component exists in the registry
 * @param toolExists - Whether the tool exists in the registry
 */
export function validateToolAssociation(
  componentName: string,
  toolName: string,
  componentExists: boolean,
  toolExists: boolean,
): void {
  // Validate component and tool names
  assertValidName(componentName, "component");
  assertValidName(toolName, "tool");

  if (!componentExists) {
    throw new Error(`Component ${componentName} not found in registry`);
  }
  if (!toolExists) {
    throw new Error(`Tool ${toolName} not found in registry`);
  }
}
