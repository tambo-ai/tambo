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
  debugKey?: string,
): Record<string, JSONSchema7Definition> {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      return [
        key,
        sanitizeJSONSchemaProperty(
          value,
          requiredProperties.includes(key),
          debugKey ? `${debugKey}.${key}` : key,
        ),
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
  property: JSONSchema7Definition | undefined,
  isRequired: boolean,
  debugKey?: string,
): JSONSchema7Definition {
  if (
    typeof property === "boolean" ||
    typeof property === "number" ||
    typeof property === "string"
  ) {
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
    examples: _examples,
    minimum: _minimum,
    maximum: _maximum,
    ...restOfProperty
  } = property ?? {};
  if (_default || _minItems || _maxItems || _maxLength || _minLength) {
    const droppedKeys = {
      _default,
      _minItems,
      _maxItems,
      _maxLength,
      _minLength,
      _examples,
      _minimum,
      _maximum,
    } as const;
    console.warn(
      "Sanitizing JSON dropped: ",
      Object.keys(droppedKeys).filter(
        (key) => !!droppedKeys[key as keyof typeof droppedKeys],
      ),
    );
  }
  if (restOfProperty.type === "object") {
    const objectProperty = {
      ...restOfProperty,
      properties: sanitizeJSONSchemaProperties(
        (restOfProperty.properties ?? {}) as Record<
          string,
          JSONSchema7Definition
        >,
        restOfProperty.required ?? [],
        debugKey,
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
  if (restOfProperty.type === "array") {
    const arrayProperty = {
      ...restOfProperty,
      items: Array.isArray(restOfProperty.items)
        ? restOfProperty.items.map((item, index) =>
            sanitizeJSONSchemaProperty(
              item,
              isRequired,
              `${debugKey}[${index}]`,
            ),
          )
        : sanitizeJSONSchemaProperty(
            restOfProperty.items as JSONSchema7Definition,
            isRequired,
            `${debugKey}.??`,
          ),
    };

    if (isRequired) {
      return arrayProperty;
    }
    return {
      anyOf: [{ type: "null" }, arrayProperty],
    };
  }
  const wellKnownKeys = ["anyOf", "oneOf", "allOf", "not"] as const;
  for (const key of wellKnownKeys) {
    if (key in restOfProperty) {
      const value = restOfProperty[key];
      if (Array.isArray(value)) {
        const sanitizedArray = value.map((item) => {
          return sanitizeJSONSchemaProperty(
            item,
            isRequired,
            `${debugKey}=>${key}`,
          );
        });

        return {
          [key]: sanitizedArray,
        };
      } else {
        return {
          [key]: sanitizeJSONSchemaProperty(
            value,
            isRequired,
            `${debugKey}=>${key}`,
          ),
        };
      }
    }
  }

  if (isRequired) {
    return restOfProperty;
  }
  return {
    anyOf: [{ type: "null" }, restOfProperty],
  };
}
