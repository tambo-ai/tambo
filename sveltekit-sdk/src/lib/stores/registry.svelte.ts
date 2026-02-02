import type { StandardSchemaV1 } from "@standard-schema/spec";
import type TamboAI from "@tambo-ai/typescript-sdk";
import type {
  TamboComponent,
  TamboTool,
  ComponentRegistry,
  TamboToolRegistry,
  TamboToolAssociations,
  JSONSchema7,
} from "../types.js";

/**
 * Check if a value is a Standard Schema validator
 */
function isStandardSchema(value: unknown): value is StandardSchemaV1 {
  return (
    typeof value === "object" &&
    value !== null &&
    "~standard" in value &&
    typeof (value as StandardSchemaV1)["~standard"] === "object"
  );
}

/**
 * Convert a Standard Schema or JSON Schema to JSON Schema format
 */
function schemaToJsonSchema(schema: unknown): JSONSchema7 {
  if (!schema) {
    return { type: "object", properties: {}, required: [] };
  }

  // If it's a Standard Schema, try to extract JSON schema
  if (isStandardSchema(schema)) {
    const standardSchema = schema as StandardSchemaV1;
    // Try to get JSON schema from the standard schema vendor info
    const vendor = standardSchema["~standard"].vendor;

    // For Zod schemas, use toJSONSchema if available
    if (vendor === "zod" && "toJSONSchema" in standardSchema) {
      return (
        standardSchema as unknown as { toJSONSchema: () => JSONSchema7 }
      ).toJSONSchema();
    }

    // Try using the global z.toJSONSchema for Zod 4+
    // This requires zod to be available at runtime
    try {
      // Dynamic import check for zod
      const maybeZod = (globalThis as Record<string, unknown>).z as
        | {
            toJSONSchema?: (schema: unknown) => JSONSchema7;
          }
        | undefined;
      if (maybeZod?.toJSONSchema) {
        return maybeZod.toJSONSchema(schema);
      }
    } catch {
      // Ignore if zod is not available
    }

    // Fallback: return a generic object schema
    return { type: "object", additionalProperties: true };
  }

  // Already JSON Schema
  return schema as JSONSchema7;
}

/**
 * Convert JSON Schema to SDK ToolParameters array
 */
function jsonSchemaToToolParameters(
  jsonSchema: JSONSchema7,
): TamboAI.ToolParameters[] {
  const properties = jsonSchema.properties as
    | Record<string, JSONSchema7>
    | undefined;
  const required = (jsonSchema.required as string[]) ?? [];

  if (!properties) return [];

  return Object.entries(properties).map(([name, prop]) => ({
    name,
    description: prop.description ?? "",
    type: (prop.type as string) ?? "string",
    isRequired: required.includes(name),
    ...(prop.enum ? { enumValues: prop.enum as string[] } : {}),
    ...(prop.items
      ? {
          items: {
            type: ((prop.items as JSONSchema7).type as string) ?? "string",
          },
        }
      : {}),
  }));
}

/**
 * Registry store interface
 */
export interface RegistryStore {
  readonly componentRegistry: ComponentRegistry;
  readonly toolRegistry: TamboToolRegistry;
  readonly toolAssociations: TamboToolAssociations;
  registerComponent(component: TamboComponent): void;
  registerComponents(components: TamboComponent[]): void;
  registerTool(tool: TamboTool, warnOnOverwrite?: boolean): void;
  registerTools(tools: TamboTool[], warnOnOverwrite?: boolean): void;
  getComponent(name: string): TamboComponent | undefined;
  getTool(name: string): TamboTool | undefined;
  getAvailableComponents(): TamboAI.AvailableComponent[];
  getClientTools(): TamboAI.ComponentContextToolMetadata[];
  associateToolWithComponent(componentName: string, toolName: string): void;
}

/**
 * Create a registry store for components and tools
 * @returns Registry store with reactive state
 */
export function createRegistryStore(): RegistryStore {
  let componentRegistry = $state<ComponentRegistry>({});
  let toolRegistry = $state<TamboToolRegistry>({});
  let toolAssociations = $state<TamboToolAssociations>({});

  function registerComponent(component: TamboComponent): void {
    const propsJsonSchema = component.propsSchema
      ? schemaToJsonSchema(component.propsSchema)
      : undefined;

    componentRegistry = {
      ...componentRegistry,
      [component.name]: {
        ...component,
        props: propsJsonSchema,
      },
    };

    // Register associated tools
    if (component.associatedTools) {
      for (const tool of component.associatedTools) {
        registerTool(tool);
        associateToolWithComponent(component.name, tool.name);
      }
    }
  }

  function registerComponents(components: TamboComponent[]): void {
    for (const component of components) {
      registerComponent(component);
    }
  }

  function registerTool(tool: TamboTool, warnOnOverwrite = true): void {
    if (warnOnOverwrite && toolRegistry[tool.name]) {
      console.warn(`Tool "${tool.name}" is being overwritten`);
    }

    toolRegistry = {
      ...toolRegistry,
      [tool.name]: tool,
    };
  }

  function registerTools(tools: TamboTool[], warnOnOverwrite = true): void {
    for (const tool of tools) {
      registerTool(tool, warnOnOverwrite);
    }
  }

  function getComponent(name: string): TamboComponent | undefined {
    return componentRegistry[name];
  }

  function getTool(name: string): TamboTool | undefined {
    return toolRegistry[name];
  }

  function associateToolWithComponent(
    componentName: string,
    toolName: string,
  ): void {
    const existing = toolAssociations[componentName] ?? [];
    if (!existing.includes(toolName)) {
      toolAssociations = {
        ...toolAssociations,
        [componentName]: [...existing, toolName],
      };
    }
  }

  function getAvailableComponents(): TamboAI.AvailableComponent[] {
    return Object.entries(componentRegistry).map(([name, component]) => {
      const associatedToolNames = toolAssociations[name] ?? [];
      const contextTools = associatedToolNames
        .map((toolName) => {
          const tool = toolRegistry[toolName];
          if (!tool) return null;
          return mapToolToContextTool(tool);
        })
        .filter(
          (tool): tool is TamboAI.ComponentContextToolMetadata => tool !== null,
        );

      return {
        name,
        description: component.description,
        props: (component.props ?? {}) as Record<string, unknown>,
        contextTools,
      };
    });
  }

  function getClientTools(): TamboAI.ComponentContextToolMetadata[] {
    // Get tools that are not associated with any component
    const associatedToolNames = new Set(Object.values(toolAssociations).flat());

    return Object.values(toolRegistry)
      .filter((tool) => !associatedToolNames.has(tool.name))
      .map(mapToolToContextTool);
  }

  function mapToolToContextTool(
    tool: TamboTool,
  ): TamboAI.ComponentContextToolMetadata {
    const jsonSchema = schemaToJsonSchema(tool.inputSchema);
    const parameters = jsonSchemaToToolParameters(jsonSchema);

    return {
      name: tool.name,
      description: tool.description,
      parameters,
      ...(tool.maxCalls !== undefined ? { maxCalls: tool.maxCalls } : {}),
      ...(tool.annotations !== undefined
        ? { annotations: tool.annotations }
        : {}),
    };
  }

  return {
    get componentRegistry() {
      return componentRegistry;
    },
    get toolRegistry() {
      return toolRegistry;
    },
    get toolAssociations() {
      return toolAssociations;
    },
    registerComponent,
    registerComponents,
    registerTool,
    registerTools,
    getComponent,
    getTool,
    getAvailableComponents,
    getClientTools,
    associateToolWithComponent,
  };
}

export type { RegistryStore as RegistryStoreType };
