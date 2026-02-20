import type {
  PrimitiveSchemaDefinition as FieldSchema,
  TamboElicitationRequest,
} from "@tambo-ai/react/mcp";

const isSingleFieldEntry = (schema: FieldSchema): boolean => {
  return (
    schema.type === "boolean" || (schema.type === "string" && "enum" in schema)
  );
};

export const isSingleEntryMode = (
  request: TamboElicitationRequest,
): boolean => {
  const fields = Object.entries(request.requestedSchema.properties);
  if (fields.length !== 1) {
    return false;
  }

  const [, schema] = fields[0];
  return isSingleFieldEntry(schema);
};
