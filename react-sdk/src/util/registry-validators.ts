import type {
  TamboComponent,
  TamboTool,
  TamboToolWithToolSchema,
} from "../model/component-metadata";
import {
  assertNoRecordSchema,
  getZodFunctionArgs,
  isStandardSchema,
  looksLikeJSONSchema,
  schemaToJsonSchema,
} from "../schema";
import { isZodFunctionSchema } from "../schema/zod";
import { assertValidName } from "./validate-component-name";

/**
 * Validates a tool before registration.
 * Throws an error if the tool is invalid.
 * @param tool - The tool to validate
 */
export function validateTool(tool: TamboTool | TamboToolWithToolSchema): void {
  // Validate tool name
  assertValidName(tool.name, "tool");

  // Validate tool schemas - check inputSchema or deprecated toolSchema
  if ("inputSchema" in tool && tool.inputSchema) {
    assertNoRecordSchema(
      tool.inputSchema,
      `inputSchema of tool "${tool.name}"`,
    );
  } else if ("toolSchema" in tool && tool.toolSchema) {
    // For deprecated toolSchema, only validate if it's a Zod function schema
    // (JSON Schema toolSchemas don't need validation)
    if (isZodFunctionSchema(tool.toolSchema)) {
      const args = getZodFunctionArgs(tool.toolSchema);
      if (args) {
        assertNoRecordSchema(args, `toolSchema of tool "${tool.name}"`);
      }
    }
  }
}

/**
 * Converts a props schema to a serialized JSON Schema format.
 * @param propsDefinition - Deprecated: legacy props definition (will log warning)
 * @param propsSchema - The props schema (Standard Schema or JSON Schema)
 * @param name - Component/tool name for error messages
 * @returns Serialized JSON Schema object
 */
function getSerializedProps(
  propsDefinition: unknown,
  propsSchema: unknown,
  name: string,
): Record<string, unknown> {
  if (propsDefinition) {
    console.warn(`propsDefinition is deprecated. Use propsSchema instead.`);
    return propsDefinition as Record<string, unknown>;
  }

  // Check for Standard Schema (Zod, Valibot, ArkType, etc.)
  if (isStandardSchema(propsSchema)) {
    try {
      return schemaToJsonSchema(propsSchema) as Record<string, unknown>;
    } catch (error) {
      console.error(
        `Error converting ${name} props schema to JSON Schema:`,
        error,
      );
      throw new Error(
        `Error converting ${name} props schema to JSON Schema: ${error}`,
      );
    }
  }

  // Check for JSON Schema
  if (looksLikeJSONSchema(propsSchema)) {
    return propsSchema as Record<string, unknown>;
  }

  throw new Error(`Invalid props schema for ${name}`);
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

  // Validate that the propsSchema does not include record types
  if (propsSchema) {
    assertNoRecordSchema(propsSchema, `propsSchema of component "${name}"`);
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
