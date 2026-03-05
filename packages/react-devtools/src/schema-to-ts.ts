/**
 * Converts a JSON Schema object into a TypeScript-like type string.
 * Used by the devtools panel to display schemas in a developer-friendly format.
 */

interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  description?: string;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  const?: unknown;
  $ref?: string;
  additionalProperties?: boolean | JsonSchema;
}

const INDENT = "  ";

/**
 * Converts a JSON Schema into a TypeScript-like type alias string for display.
 * @param schema - A JSON Schema object (or unknown value)
 * @param name - The type alias name to use
 * @returns A complete TypeScript type alias (e.g. `type InputSchema = { ... }`)
 */
export const jsonSchemaToTs = (
  schema: unknown,
  name: "InputSchema" | "OutputSchema" = "InputSchema",
): string => {
  if (!isJsonSchema(schema)) {
    return `type ${name} = ${formatFallback(schema)}`;
  }
  return `type ${name} = ${renderType(schema, 0)}`;
};

const isJsonSchema = (value: unknown): value is JsonSchema =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const formatFallback = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const renderType = (schema: JsonSchema, depth: number): string => {
  if (schema.$ref) {
    const refName = schema.$ref.split("/").pop() ?? "unknown";
    return refName;
  }

  if (schema.const !== undefined) {
    return JSON.stringify(schema.const);
  }

  if (schema.enum) {
    return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  }

  if (schema.anyOf) {
    return renderUnion(schema.anyOf, depth);
  }

  if (schema.oneOf) {
    return renderUnion(schema.oneOf, depth);
  }

  if (schema.allOf) {
    return schema.allOf.map((s) => renderType(s, depth)).join(" & ");
  }

  if (Array.isArray(schema.type)) {
    return schema.type.map((t) => mapPrimitive(t)).join(" | ");
  }

  switch (schema.type) {
    case "object":
      return renderObject(schema, depth);
    case "array":
      return renderArray(schema, depth);
    case "string":
    case "number":
    case "integer":
    case "boolean":
    case "null":
      return mapPrimitive(schema.type);
    default:
      // No type specified but has properties — treat as object
      if (schema.properties) {
        return renderObject(schema, depth);
      }
      return "unknown";
  }
};

const mapPrimitive = (type: string): string => {
  switch (type) {
    case "integer":
      return "number";
    case "null":
      return "null";
    default:
      return type;
  }
};

const renderObject = (schema: JsonSchema, depth: number): string => {
  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    if (schema.additionalProperties === true) {
      return "Record<string, unknown>";
    }
    if (isJsonSchema(schema.additionalProperties)) {
      const valType = renderType(schema.additionalProperties, depth);
      return `Record<string, ${valType}>`;
    }
    return "{}";
  }

  const requiredSet = new Set(schema.required ?? []);
  const indent = INDENT.repeat(depth + 1);
  const closingIndent = INDENT.repeat(depth);

  const lines = Object.entries(schema.properties).map(([key, propSchema]) => {
    const optional = requiredSet.has(key) ? "" : "?";
    const propType = renderType(propSchema, depth + 1);
    const comment = propSchema.description
      ? `${indent}/** ${propSchema.description} */\n`
      : "";
    return `${comment}${indent}${key}${optional}: ${propType};`;
  });

  return `{\n${lines.join("\n")}\n${closingIndent}}`;
};

const renderArray = (schema: JsonSchema, depth: number): string => {
  if (!schema.items) {
    return "unknown[]";
  }
  const itemType = renderType(schema.items, depth);
  // Wrap complex types in parens for clarity
  if (itemType.includes("|") || itemType.includes("&")) {
    return `(${itemType})[]`;
  }
  return `${itemType}[]`;
};

const renderUnion = (schemas: JsonSchema[], depth: number): string =>
  schemas.map((s) => renderType(s, depth)).join(" | ");
