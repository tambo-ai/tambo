import { z } from "zod";
import { TamboComponent } from "../providers";
import { mapTamboToolToContextTool } from "../util/registry";

/**
 * Serializes the registry for testing purposes
 * @param mockRegistry - The registry to serialize
 * @returns The serialized registry
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
      props: z.toJSONSchema(propsSchema as z.ZodTypeAny),
      contextTools: associatedTools?.map((tool) =>
        mapTamboToolToContextTool(tool),
      ),
    }),
  );
}
