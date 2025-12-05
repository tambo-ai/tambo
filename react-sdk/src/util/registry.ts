import TamboAI from "@tambo-ai/typescript-sdk";
import type { JSONSchema7 } from "json-schema";
import type { ZodTypeAny } from "zod/v3";
import {
  ComponentContextToolMetadata,
  ComponentRegistry,
  ParameterSpec,
  RegisteredComponent,
  TamboTool,
  TamboToolAssociations,
  TamboToolRegistry,
} from "../model/component-metadata";
import {
  getJsonSchemaTupleItems,
  isJsonSchemaTuple,
  isStandardSchema,
  isZod3FunctionSchema,
  type JSONSchema7Extended,
  looksLikeJSONSchema,
  schemaToJsonSchema,
} from "./schema";

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
  const parameters = getParametersFromToolSchema(tool.toolSchema);

  return {
    name: tool.name,
    description: tool.description,
    parameters,
  };
};

/**
 * Detects if a schema is an object with `args` and optional `returns` properties.
 * This format preserves tuple structure and works with any Standard Schema library.
 */
function isToolSchemaObject(
  schema: unknown,
): schema is { args: unknown; returns?: unknown } {
  return (
    typeof schema === "object" &&
    schema !== null &&
    "args" in schema &&
    (schema as { args: unknown }).args !== undefined
  );
}

/**
 * Extracts parameter specifications from Zod 3 function tuple args.
 * This is Zod 3-specific because it uses the `.parameters()` method.
 */
function extractParamsFromZod3Function(schema: unknown): ParameterSpec[] {
  const fn = schema as { parameters: () => { items: ZodTypeAny[] } };
  const parameters = fn.parameters();
  return parameters.items.map(
    (param, index): ParameterSpec => ({
      name: `param${index + 1}`,
      type: getZodBaseType(param),
      description: param.description ?? "",
      isRequired: !param.isOptional(),
      schema: schemaToJsonSchema(param),
    }),
  );
}

/**
 * Extracts parameter specifications from JSON Schema tuple items.
 * Supports both draft-07 (items as array) and draft 2020-12 (prefixItems).
 * This is library-agnostic - works with Zod, Valibot, ArkType, etc.
 */
function extractParamsFromJsonSchemaTuple(
  tupleItems: JSONSchema7[],
): ParameterSpec[] {
  return tupleItems.map((item, index) => ({
    name: `param${index + 1}`,
    type: typeof item.type === "string" ? item.type : "object",
    description: item.description ?? "",
    isRequired: true, // tuple items are positional
    schema: item,
  }));
}

/**
 * Wraps a JSON Schema as a single "args" parameter.
 */
function wrapAsArgsParam(jsonSchema: JSONSchema7): ParameterSpec[] {
  return [
    {
      name: "args",
      type: "object",
      description: jsonSchema.description ?? "",
      isRequired: true,
      schema: jsonSchema,
    },
  ];
}

/**
 * Gets the base type name from a Zod 3 schema.
 * This is Zod 3-specific for extracting function parameters.
 */
function getZodBaseType(schema: ZodTypeAny): string {
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
      return "string";
  }
}

/**
 * Extracts parameter specifications from a tool schema.
 * Supports multiple schema formats in a library-agnostic way:
 *
 * 1. **JSON Schema tuple** (prefixItems or items array) → individual params
 * 2. **Object with {args, returns}** → convert args to JSON Schema, extract tuple items (recommended)
 * 3. **Zod 3 function** → individual params via `.parameters().items` (deprecated)
 * 4. **Other Standard Schema** → "args" wrapper
 * @param schema - The tool's schema (Standard Schema, JSON Schema, or {args, returns} object)
 * @returns An array of parameter specifications
 */
const getParametersFromToolSchema = (
  schema: TamboTool["toolSchema"],
): ParameterSpec[] => {
  // 1. Handle JSON Schema - check for tuple pattern
  if (looksLikeJSONSchema(schema)) {
    const jsonSchema = schema as JSONSchema7Extended;
    if (isJsonSchemaTuple(jsonSchema)) {
      const tupleItems = getJsonSchemaTupleItems(jsonSchema);
      if (tupleItems) {
        return extractParamsFromJsonSchemaTuple(tupleItems);
      }
    }
    return wrapAsArgsParam(jsonSchema);
  }

  // 2. Handle object with {args, returns} - library-agnostic tuple extraction (recommended)
  //    Convert args to JSON Schema, then check for tuple pattern
  if (isToolSchemaObject(schema)) {
    const argsSchema = schema.args;
    if (isStandardSchema(argsSchema)) {
      const jsonSchema = schemaToJsonSchema(argsSchema) as JSONSchema7Extended;
      if (isJsonSchemaTuple(jsonSchema)) {
        const tupleItems = getJsonSchemaTupleItems(jsonSchema);
        if (tupleItems) {
          return extractParamsFromJsonSchemaTuple(tupleItems);
        }
      }
      return wrapAsArgsParam(jsonSchema);
    }
  }

  // 3. Handle Zod 3 function schema - extract individual params from tuple (deprecated)
  if (isZod3FunctionSchema(schema)) {
    console.warn(
      "[Tambo] z.function() is deprecated. Use { args: z.tuple([...]), returns: z.type() } instead.",
    );
    return extractParamsFromZod3Function(schema);
  }

  // 4. Handle other Standard Schema - wrap as "args"
  if (isStandardSchema(schema)) {
    return wrapAsArgsParam(schemaToJsonSchema(schema));
  }

  console.warn("Unknown tool schema type, returning empty parameters");
  return [];
};
