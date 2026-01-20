import { Logger } from "@nestjs/common";
import type { JSONSchema7 } from "json-schema";
import {
  AvailableComponentDto,
  ComponentContextToolMetadataDto,
  ToolParameters,
} from "../threads/dto/generate-component.dto";
import type { V1AvailableComponentDto, V1ToolDto } from "./dto/tool.dto";

const logger = new Logger("V1ToolConversions");

/**
 * Extract the JSON Schema type as a string.
 * Handles both simple types and arrays of types.
 *
 * @param schema - The JSON Schema to extract type from
 * @param propertyName - Name of the property (for logging)
 * @returns The schema type as a string, defaults to "string" with warning if missing
 */
function getSchemaType(
  schema: JSONSchema7 | undefined,
  propertyName?: string,
): string {
  if (!schema?.type) {
    const propContext = propertyName ? ` for property "${propertyName}"` : "";
    logger.warn(
      `JSON Schema${propContext} has no type specified, defaulting to "string". ` +
        `Consider adding explicit type to the schema.`,
    );
    return "string";
  }
  if (Array.isArray(schema.type)) {
    // Filter out "null" and take the first non-null type
    const nonNullTypes = schema.type.filter((t) => t !== "null");
    if (nonNullTypes.length === 0) {
      const propContext = propertyName ? ` for property "${propertyName}"` : "";
      logger.warn(
        `JSON Schema${propContext} has only null type, defaulting to "string".`,
      );
      return "string";
    }
    return nonNullTypes[0];
  }
  return schema.type;
}

/**
 * Convert a JSON Schema property to internal ToolParameters format.
 */
function jsonSchemaPropertyToToolParameter(
  name: string,
  propSchema: JSONSchema7,
  isRequired: boolean,
): ToolParameters {
  const param = new ToolParameters();
  param.name = name;
  param.type = getSchemaType(propSchema, name);
  param.description = propSchema.description ?? "";
  param.isRequired = isRequired;

  // Handle array items
  if (param.type === "array" && propSchema.items) {
    const itemsSchema = Array.isArray(propSchema.items)
      ? propSchema.items[0]
      : propSchema.items;
    if (typeof itemsSchema === "object" && "type" in itemsSchema) {
      param.items = { type: getSchemaType(itemsSchema, `${name}.items`) };
    }
  }

  // Handle enum values
  if (propSchema.enum && Array.isArray(propSchema.enum)) {
    param.enumValues = propSchema.enum.filter(
      (v): v is string => typeof v === "string",
    );
  }

  // Store the original schema for complex types
  param.schema = propSchema;

  return param;
}

/**
 * Convert a JSON Schema object to internal ToolParameters array.
 * Parses the schema's properties into individual parameter definitions.
 */
function jsonSchemaToToolParameters(inputSchema: object): ToolParameters[] {
  const schema = inputSchema as JSONSchema7;

  // Handle non-object schemas
  if (schema.type !== "object" || !schema.properties) {
    return [];
  }

  const requiredProps = new Set(schema.required ?? []);
  const parameters: ToolParameters[] = [];

  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    // Skip boolean schemas (true/false mean any/none)
    if (typeof propSchema !== "object") {
      continue;
    }

    parameters.push(
      jsonSchemaPropertyToToolParameter(
        propName,
        propSchema,
        requiredProps.has(propName),
      ),
    );
  }

  return parameters;
}

/**
 * Convert a V1 tool definition to internal ComponentContextToolMetadata format.
 *
 * V1 tools use JSON Schema for inputSchema, while internal format uses
 * parsed ToolParameters array.
 */
export function convertV1ToolToInternal(
  tool: V1ToolDto,
): ComponentContextToolMetadataDto {
  const result = new ComponentContextToolMetadataDto();
  result.name = tool.name;
  result.description = tool.description;
  result.parameters = jsonSchemaToToolParameters(tool.inputSchema);
  // V1 doesn't have maxCalls, so we don't set it (undefined = no limit)
  return result;
}

/**
 * Convert an array of V1 tool definitions to internal format.
 * Returns undefined if input is undefined or empty.
 */
export function convertV1ToolsToInternal(
  tools: V1ToolDto[] | undefined,
): ComponentContextToolMetadataDto[] | undefined {
  if (!tools || tools.length === 0) {
    return undefined;
  }

  return tools.map(convertV1ToolToInternal);
}

/**
 * Convert a V1 available component definition to internal format.
 *
 * V1 components use JSON Schema for propsSchema, while internal format uses
 * parsed props metadata.
 *
 * Note: V1 components don't have contextTools - those are passed separately
 * in the tools array. We set contextTools to empty array.
 */
export function convertV1ComponentToInternal(
  component: V1AvailableComponentDto,
): AvailableComponentDto {
  const result = new AvailableComponentDto();
  result.name = component.name;
  result.description = component.description;
  // V1 doesn't have component-specific contextTools, they're passed separately
  result.contextTools = [];
  // Store the propsSchema directly - the internal system accepts JSON Schema
  // for props.
  result.props = component.propsSchema;
  return result;
}

/**
 * Convert an array of V1 available component definitions to internal format.
 * Returns undefined if input is undefined or empty.
 */
export function convertV1ComponentsToInternal(
  components: V1AvailableComponentDto[] | undefined,
): AvailableComponentDto[] | undefined {
  if (!components || components.length === 0) {
    return undefined;
  }

  return components.map(convertV1ComponentToInternal);
}
