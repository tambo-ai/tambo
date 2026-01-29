import { TamboComponent, TamboTool } from "../providers";
import { isStandardSchema, safeSchemaToJsonSchema } from "../schema";
import { mapTamboToolToContextTool } from "../util/registry";

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

interface CreateMockToolOptions {
  inputSchema: TamboTool["inputSchema"];
  outputSchema?: TamboTool["outputSchema"];
  maxCalls?: number;
}

// Helper to create a minimal TamboTool for testing
/**
 * Creates a mock TamboTool with the given input schema for testing purposes.
 * Accepts either an inputSchema directly or an options object with inputSchema and outputSchema.
 * @param schemaOrOptions - The input schema or options object
 * @returns A mock TamboTool instance
 * @internal
 */
export function createMockTool(
  schemaOrOptions: TamboTool["inputSchema"] | CreateMockToolOptions,
): TamboTool {
  // Check if options object was passed
  const hasInputSchemaProperty = (
    obj: unknown,
  ): obj is CreateMockToolOptions => {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "inputSchema" in obj &&
      obj.inputSchema != null
    );
  };

  if (hasInputSchemaProperty(schemaOrOptions)) {
    return {
      name: "mockTool",
      description: "A mock tool for testing",
      tool: jest.fn().mockImplementation(() => {}),
      inputSchema: schemaOrOptions.inputSchema,
      outputSchema: schemaOrOptions.outputSchema ?? {
        type: "object",
        properties: {},
      },
      ...(schemaOrOptions.maxCalls !== undefined
        ? { maxCalls: schemaOrOptions.maxCalls }
        : {}),
    };
  }

  return {
    name: "mockTool",
    description: "A mock tool for testing",
    tool: jest.fn().mockImplementation(() => {}),
    inputSchema: schemaOrOptions,
    outputSchema: { type: "object", properties: {} },
  };
}
