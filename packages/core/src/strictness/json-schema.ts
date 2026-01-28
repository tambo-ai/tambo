import { JSONSchema7, JSONSchema7Definition } from "json-schema";

/**
 * Checks if an anyOf array looks like it's defining type alternatives
 * (e.g., from z.any().nullable() which produces [{}, {type: "null"}])
 * rather than adding constraints to an object.
 *
 * Type alternatives pattern: contains empty object {} or {type: "null"}
 * Constraint pattern: contains objects with properties/required/etc
 */
function looksLikeTypeAlternatives(
  anyOfValue: JSONSchema7Definition[],
): boolean {
  return anyOfValue.some((item) => {
    if (typeof item !== "object" || item === null) {
      return false;
    }
    // Empty object {} means "any type" - this is from z.any()
    if (Object.keys(item).length === 0) {
      return true;
    }
    // {type: "null"} is the nullable variant
    if (item.type === "null") {
      return true;
    }
    return false;
  });
}

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
export function strictifyJSONSchemaProperties(
  properties: Record<string, JSONSchema7Definition>,
  requiredProperties: string[],
  debugKey?: string,
): Record<string, JSONSchema7Definition> {
  return Object.fromEntries(
    Object.entries(properties)
      .map(([key, value]) => {
        return [
          key,
          strictifyJSONSchemaProperty(
            value,
            requiredProperties.includes(key),
            debugKey ? `${debugKey}.${key}` : `$.${key}`,
          ),
        ] as const;
      })
      .filter(([_, value]) => value !== null) as [
      string,
      JSONSchema7Definition,
    ][],
  );
}

/**
 * Logs a warning if any keys were dropped during sanitization.
 */
function warnDroppedKeys(
  property: JSONSchema7Definition | undefined,
  restOfProperty: Record<string, unknown>,
  debugKey?: string,
): void {
  const prop = typeof property === "object" ? property : {};
  const originalKeys = Object.keys(prop);
  const restKeys = Object.keys(restOfProperty);
  const droppedKeys = originalKeys
    .filter(
      (key) =>
        !restKeys.includes(key) &&
        prop[key as keyof typeof prop] != null &&
        prop[key as keyof typeof prop] !== undefined,
    )
    // default will be handled by the tool call strictifier
    .filter((key) => key !== "default");
  if (droppedKeys.length > 0) {
    console.warn(
      `Sanitizing JSON dropped key(s) at ${debugKey}: ${droppedKeys.join(", ")}`,
    );
  }
}

function stripValidationProps(
  property: JSONSchema7 | undefined,
  debugKey?: string,
): Partial<JSONSchema7> {
  if (typeof property === "boolean") {
    return property;
  }
  const source: Record<string, unknown> =
    typeof property === "object" ? (property as Record<string, unknown>) : {};
  const {
    format: _format,
    default: _default,
    minItems: _minItems,
    maxItems: _maxItems,
    maxLength: _maxLength,
    minLength: _minLength,
    examples: _examples,
    minimum: _minimum,
    exclusiveMaximum: _exclusiveMaximum,
    exclusiveMinimum: _exclusiveMinimum,
    maximum: _maximum,
    pattern: _pattern,
    multipleOf: _multipleOf,
    propertyNames: _propertyNames,
    $schema: _schema,
    ...restOfProperty
  } = source;

  warnDroppedKeys(property, restOfProperty, debugKey);
  return restOfProperty;
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
export function strictifyJSONSchemaProperty(
  property: JSONSchema7Definition | undefined,
  isRequired: boolean,
  debugKey?: string,
): JSONSchema7Definition | null {
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

  // Check for anyOf/oneOf/allOf/not BEFORE checking type
  // This prevents invalid schemas where type and anyOf are mixed
  const restOfProperty = stripValidationProps(property, debugKey);
  const wellKnownKeys = ["anyOf", "oneOf", "allOf", "not"] as const;
  for (const key of wellKnownKeys) {
    if (key in restOfProperty) {
      const value = restOfProperty[key];

      // Determine if we should strip object-related properties (type, properties, required, additionalProperties).
      // We only do this for `anyOf` when it looks like type alternatives (e.g., from z.any().nullable()),
      // NOT for `allOf` which typically adds constraints to an existing object type.
      const shouldStripObjectProps =
        key === "anyOf" &&
        restOfProperty.type === "object" &&
        Array.isArray(value) &&
        looksLikeTypeAlternatives(value);

      const propsToSpread = shouldStripObjectProps
        ? (() => {
            const {
              type: _type,
              properties: _properties,
              required: _required,
              additionalProperties: _additionalProperties,
              ...rest
            } = restOfProperty;
            return rest;
          })()
        : restOfProperty;

      if (Array.isArray(value)) {
        const sanitizedArray = value
          .map((item, index) => {
            return strictifyJSONSchemaProperty(
              item,
              isRequired,
              `${debugKey}.${key}[${index}]`,
            );
          })
          .filter((value) => value !== null);
        // Only collapse single-item anyOf/oneOf, NOT allOf.
        // allOf items are constraints that combine with the parent schema,
        // so collapsing would lose parent's type/properties.
        if (
          (key === "anyOf" || key === "oneOf") &&
          sanitizedArray.length === 1
        ) {
          // no need for the wrapper
          return sanitizedArray[0];
        }

        return {
          ...propsToSpread,
          [key]: sanitizedArray,
        };
      } else {
        if (key === "not" && (!value || Object.keys(value).length === 0)) {
          // this is a broken case, "not: {}" which means "not everything" or "never"
          // so we just ignore it
          return null;
        }

        const strictSchema = strictifyJSONSchemaProperty(
          value as JSONSchema7Definition,
          isRequired,
          `${debugKey}.${key}`,
        );
        if (!strictSchema) {
          return null;
        }
        return {
          ...propsToSpread,
          [key]: strictSchema,
        };
      }
    }
  }

  if (
    property?.type === "boolean" ||
    property?.type === "number" ||
    property?.type === "integer" ||
    property?.type === "string"
  ) {
    // Strip validation properties even for these simple types
    const restOfProperty = stripValidationProps(property, debugKey);

    if (isRequired) {
      return restOfProperty;
    }
    return {
      anyOf: [
        {
          type: "null",
        },
        restOfProperty,
      ],
    };
  }

  if (property?.type === "object") {
    const restOfProperty = stripValidationProps(property, debugKey);
    const objectProperty = {
      ...restOfProperty,
      properties: strictifyJSONSchemaProperties(
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
  if (property?.type === "array") {
    const restOfProperty = stripValidationProps(property, debugKey);
    const items = Array.isArray(restOfProperty.items)
      ? restOfProperty.items
          .map((item, index) =>
            strictifyJSONSchemaProperty(
              item,
              isRequired,
              `${debugKey}.items[${index}]`,
            ),
          )
          .filter((value) => value !== null)
      : strictifyJSONSchemaProperty(
          restOfProperty.items as JSONSchema7Definition,
          isRequired,
          `${debugKey}.items`,
        );
    if (!items || (Array.isArray(items) && items.length === 0)) {
      return null;
    }
    const arrayProperty = {
      ...restOfProperty,
      items: items,
    };

    if (isRequired) {
      return arrayProperty;
    }
    return {
      anyOf: [{ type: "null" }, arrayProperty],
    };
  }
  if (!property?.type) {
    // technically this means "any" type but
    // restOfProperty was already defined above, reuse it
    return {
      anyOf: [
        { type: "null" },
        { type: "string" },
        { type: "number" },
        { type: "integer" },
        { type: "boolean" },
        { type: "null" },
        // OpenAI and others can't handle arbitrary objects or arrays, so we
        // don't include them here:
        // { type: "object" },
        // { type: "array" },
      ],
      ...restOfProperty,
    };
  }
  if (isRequired || Object.keys(restOfProperty).length === 0) {
    return restOfProperty;
  }
  return {
    anyOf: [{ type: "null" }, restOfProperty],
  };
}
