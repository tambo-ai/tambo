/**
 * Registry Conversion Utilities
 *
 * Converts beta SDK component/tool types to v1 API format.
 * Reuses the beta SDK's TamboRegistryProvider but provides conversion
 * utilities for sending component/tool metadata to the v1 API.
 */

import type { JSONSchema7 } from "json-schema";
import type { TamboComponent, TamboTool } from "../../model/component-metadata";
import { schemaToJsonSchema } from "../../schema/schema";
import type { AvailableComponent } from "../types/component";
import type { Tool } from "../types/tool";

/**
 * Convert a registered component to v1 API format.
 *
 * Transforms TamboComponent (beta SDK format with Standard Schema support)
 * to AvailableComponent (v1 API format requiring JSON Schema).
 * @param component - Component from beta SDK registry
 * @returns Component metadata in v1 API format
 * @throws {Error} if propsSchema conversion fails
 */
export function toAvailableComponent(
  component: TamboComponent,
): AvailableComponent {
  // Convert propsSchema (required for v1)
  if (!component.propsSchema) {
    throw new Error(
      `Component "${component.name}" missing propsSchema - required for v1 API`,
    );
  }

  const propsSchema: JSONSchema7 = schemaToJsonSchema(component.propsSchema);

  return {
    name: component.name,
    description: component.description,
    propsSchema: propsSchema as Record<string, unknown>,
    // stateSchema is v1-specific and not available in beta SDK components
    // Components can still have state, but schema must be defined separately
  };
}

/**
 * Convert multiple registered components to v1 API format.
 *
 * Transforms a Map of TamboComponents to an array of AvailableComponents.
 * Components without propsSchema will be logged as warnings and skipped.
 * @param components - Map of components from beta SDK registry
 * @returns Array of component metadata in v1 API format
 */
export function toAvailableComponents(
  components: Map<string, TamboComponent>,
): AvailableComponent[] {
  const results: AvailableComponent[] = [];

  for (const [name, component] of components) {
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
 * Transforms TamboTool (beta SDK format with Standard Schema support)
 * to Tool (v1 API format requiring JSON Schema).
 * @param tool - Tool from beta SDK registry
 * @returns Tool metadata in v1 API format
 * @throws {Error} if inputSchema conversion fails
 */
export function toAvailableTool(tool: TamboTool): Tool {
  // Extract inputSchema from tool
  if (!tool.inputSchema) {
    throw new Error(
      `Tool "${tool.name}" missing inputSchema - required for v1 API`,
    );
  }

  // Convert inputSchema to JSON Schema
  const inputSchema: JSONSchema7 = schemaToJsonSchema(tool.inputSchema);

  return {
    name: tool.name,
    description: tool.description,
    inputSchema: inputSchema as Record<string, unknown>,
  };
}

/**
 * Convert multiple registered tools to v1 API format.
 *
 * Transforms a Map of TamboTools to an array of Tools.
 * Tools without inputSchema will be logged as warnings and skipped.
 * @param tools - Map of tools from beta SDK registry
 * @returns Array of tool metadata in v1 API format
 */
export function toAvailableTools(tools: Map<string, TamboTool>): Tool[] {
  const results: Tool[] = [];

  for (const [name, tool] of tools) {
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
