import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { TamboComponent } from "../providers";

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
      props: zodToJsonSchema(propsSchema as z.ZodTypeAny),
      contextTools: associatedTools?.map(
        ({ toolSchema, tool: _tool, ...toolEntry }) => ({
          ...toolEntry,
          parameters: toolSchema
            .parameters()
            .items.map((p: z.ZodTypeAny, index: number) => ({
              name: `param${index + 1}`,
              schema: zodToJsonSchema(p),
              isRequired: true,
              description: p.description,
              type: (zodToJsonSchema(p) as any).type,
            })),
        }),
      ),
    }),
  );
}
