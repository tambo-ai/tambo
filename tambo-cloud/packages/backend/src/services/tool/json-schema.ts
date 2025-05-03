import { JSONSchema7Definition } from "json-schema";

/**
 * Sanitizes a JSON Schema object to ensure it is valid for OpenAI function
 * calling in strict mode.
 *
 * It does this primarily by making all parameters required, and then making
 * any parameters that are not in the required list be nullable. (e.g. if
 * the required list is ["a", "b"], then "a" and "b" will be required, and
 * "c" will be required but nullable.)
 *
 * Finally, it drops any JSONSchema metadata that is not valid for strict mode
 * like `default`, `minItems`, `maxItems`, `maxLength`, and `minLength`.
 */
export function sanitizeJSONSchemaProperties(
  properties: Record<string, JSONSchema7Definition>,
  requiredProperties: string[],
): Record<string, JSONSchema7Definition> {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      return [
        key,
        sanitizeJSONSchemaProperty(value, requiredProperties.includes(key)),
      ] as const;
    }),
  );
}

/**
 * Sanitizes a single JSON Schema property to ensure it is valid for OpenAI
 * function calling.
 *
 * It does this primarily by making all parameters required, and then making any
 * parameters that are not in the required list be nullable. (e.g. if the
 * required list is ["a", "b"], then "a" and "b" will be required, and "c" will
 * be required but nullable.)
 */
export function sanitizeJSONSchemaProperty(
  property: JSONSchema7Definition,
  isRequired: boolean,
): JSONSchema7Definition {
  if (typeof property === "boolean") {
    if (isRequired) {
      return property;
    }
    return {
      anyOf: [
        {
          type: "null",
        },
        property,
      ],
    };
  }
  const {
    format: _format,
    default: _default,
    minItems: _minItems,
    maxItems: _maxItems,
    maxLength: _maxLength,
    minLength: _minLength,
    ...restOfProperty
  } = property;
  if (_default || _minItems || _maxItems || _maxLength || _minLength) {
    const droppedKeys = {
      _default,
      _minItems,
      _maxItems,
      _maxLength,
      _minLength,
    } as const;
    console.warn(
      "Sanitizing JSON dropped: ",
      Object.keys(droppedKeys).filter(
        (key) => !!droppedKeys[key as keyof typeof droppedKeys],
      ),
    );
  }
  if (property.type === "object") {
    const objectProperty = {
      ...restOfProperty,
      properties: sanitizeJSONSchemaProperties(
        (property.properties ?? {}) as Record<string, JSONSchema7Definition>,
        Object.keys(restOfProperty.properties || {}),
      ),
      required: Object.keys(restOfProperty.properties || {}),
      additionalProperties: false,
    };
    if (isRequired) {
      return objectProperty;
    }
    return {
      anyOf: [{ type: "null" }, objectProperty],
    };
  }
  if (property.type === "array") {
    const arrayProperty = {
      ...restOfProperty,
      items: Array.isArray(property.items)
        ? property.items.map((item) =>
            sanitizeJSONSchemaProperty(item, isRequired),
          )
        : sanitizeJSONSchemaProperty(
            property.items as JSONSchema7Definition,
            isRequired,
          ),
    };
    if (isRequired) {
      return arrayProperty;
    }
    return {
      anyOf: [{ type: "null" }, arrayProperty],
    };
  }
  return restOfProperty;
}
