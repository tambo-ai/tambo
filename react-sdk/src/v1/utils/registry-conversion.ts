/**
 * Registry Conversion Utilities
 *
 * Converts beta SDK component/tool types to v1 API format.
 * Reuses the beta SDK's TamboRegistryProvider but provides conversion
 * utilities for sending component/tool metadata to the v1 API.
 */

import type { JSONSchema7 } from "json-schema";
import type {
  RegisteredComponent,
  TamboTool,
  UnsupportedSchemaTamboTool,
} from "../../model/component-metadata.js";
import { schemaToJsonSchema } from "../../schema/schema.js";
import type { RunCreateParams } from "@tambo-ai/typescript-sdk/resources/threads/runs";

// Use the SDK's types for API requests
type AvailableComponent = RunCreateParams.AvailableComponent;
type Tool = RunCreateParams.Tool;

/**
 * Convert a registered component to v1 API format.
 *
 * Transforms RegisteredComponent (from the registry, with props already converted
 * to JSON Schema) to AvailableComponent (v1 API format).
 * @param component - Component from beta SDK registry (already has props as JSON Schema)
 * @returns Component metadata in v1 API format
 * @throws {Error} if props is missing
 */
export function toAvailableComponent(
  component: RegisteredComponent,
): AvailableComponent {
  // props is the JSON Schema that was converted from propsSchema during registration
  if (!component.props) {
    throw new Error(
      `Component "${component.name}" missing props - required for v1 API`,
    );
  }

  return {
    name: component.name,
    description: component.description,
    propsSchema: component.props as Record<string, unknown>,
    // stateSchema is v1-specific and not available in beta SDK components
    // Components can still have state, but schema must be defined separately
  };
}

/**
 * Convert multiple registered components to v1 API format.
 *
 * Transforms a Record/Map of RegisteredComponents to an array of AvailableComponents.
 * Components without props will be logged as warnings and skipped.
 * @param components - Record or Map of components from beta SDK registry
 * @returns Array of component metadata in v1 API format
 */
export function toAvailableComponents(
  components:
    | Record<string, RegisteredComponent>
    | Map<string, RegisteredComponent>,
): AvailableComponent[] {
  const results: AvailableComponent[] = [];

  const entries =
    components instanceof Map
      ? Array.from(components.entries())
      : Object.entries(components);

  for (const [name, component] of entries) {
    try {
      results.push(toAvailableComponent(component));
    } catch (error) {
      console.warn(
        `Skipping component "${name}" in v1 conversion: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return results;
}

/**
 * Convert a registered tool to v1 API format.
 *
 * Transforms TamboTool or UnsupportedSchemaTamboTool (beta SDK format with
 * Standard Schema support) to Tool (v1 API format requiring JSON Schema).
 * Handles both new inputSchema and deprecated toolSchema formats.
 * @param tool - Tool from beta SDK registry
 * @returns Tool metadata in v1 API format
 * @throws {Error} if schema conversion fails or schema is missing
 */
export function toAvailableTool(
  tool: TamboTool | UnsupportedSchemaTamboTool,
): Tool {
  // Check for inputSchema (modern format - required in TamboTool)
  if ("inputSchema" in tool && tool.inputSchema) {
    const inputSchema: JSONSchema7 = schemaToJsonSchema(tool.inputSchema);
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: inputSchema as Record<string, unknown>,
    };
  }

  // Check for deprecated toolSchema format (UnsupportedSchemaTamboTool)
  if ("toolSchema" in tool && tool.toolSchema) {
    const inputSchema: JSONSchema7 = schemaToJsonSchema(tool.toolSchema);
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: inputSchema as Record<string, unknown>,
    };
  }

  throw new Error(
    `Tool "${tool.name}" missing inputSchema or toolSchema - required for v1 API`,
  );
}

/**
 * Convert multiple registered tools to v1 API format.
 *
 * Transforms a Record/Map of TamboTools or UnsupportedSchemaTamboTool to an array
 * of Tools. Tools without inputSchema/toolSchema will be logged as warnings
 * and skipped.
 * @param tools - Record or Map of tools from beta SDK registry
 * @returns Array of tool metadata in v1 API format
 */
export function toAvailableTools(
  tools:
    | Record<string, TamboTool | UnsupportedSchemaTamboTool>
    | Map<string, TamboTool | UnsupportedSchemaTamboTool>,
): Tool[] {
  const results: Tool[] = [];

  const entries =
    tools instanceof Map ? Array.from(tools.entries()) : Object.entries(tools);

  for (const [name, tool] of entries) {
    try {
      results.push(toAvailableTool(tool));
    } catch (error) {
      console.warn(
        `Skipping tool "${name}" in v1 conversion: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return results;
}
