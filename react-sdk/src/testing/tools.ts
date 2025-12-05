import { TamboComponent } from "../providers";
import { mapTamboToolToContextTool } from "../util/registry";
import { isStandardSchema, safeSchemaToJsonSchema } from "../util/schema";

/**
 * Serializes the registry for testing purposes.
 * Converts Standard Schema validators to JSON Schema format.
 * Uses the same logic as production code via mapTamboToolToContextTool.
 * @param mockRegistry - The registry to serialize
 * @returns The serialized registry with JSON Schema representations
 */
export function serializeRegistry(mockRegistry: TamboComponent[]) {
  return mockRegistry.map(
    ({
      component: _component,
      propsSchema,
      associatedTools,
      ...componentEntry
    }) => ({
      ...componentEntry,
      props: isStandardSchema(propsSchema)
        ? safeSchemaToJsonSchema(propsSchema)
        : propsSchema,
      contextTools: associatedTools?.map((tool) =>
        mapTamboToolToContextTool(tool),
      ),
    }),
  );
}
