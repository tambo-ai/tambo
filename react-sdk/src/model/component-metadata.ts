import type { ToolAnnotations as MCPToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import TamboAI from "@tambo-ai/typescript-sdk";
import { JSONSchema7 } from "json-schema";
import { ComponentType } from "react";

/**
 * A schema type that accepts either a Standard Schema compliant validator
 * (e.g., Zod, Valibot, ArkType) or a raw JSON Schema object.
 *
 * Standard Schema is a specification that provides a unified interface for
 * TypeScript validation libraries. Libraries like Zod implement this spec,
 * allowing us to accept any compliant validator without depending on a specific library.
 * @see https://standardschema.dev/
 */
export type SupportedSchema<Input = unknown, Output = Input> =
  | StandardSchemaV1<Input, Output>
  | JSONSchema7;

/**
 * Annotations describing a tool's behavior, aligned with the MCP (Model Context Protocol)
 * specification. These hints help clients understand how tools behave and can be used
 * to optimize tool execution strategies.
 * @see https://modelcontextprotocol.io/specification/2025-06-18/schema#toolannotations
 */
export type ToolAnnotations = MCPToolAnnotations & {
  /**
   * Indicates that the tool is safe to be called repeatedly while a response is
   * being streamed. This is typically used for read-only tools that do not
   * cause side effects.
   */
  tamboStreamableHint?: boolean;
};

/** Extension of the ToolParameters interface from Tambo AI to include JSONSchema definition */
export type ParameterSpec = TamboAI.ToolParameters & {
  schema?: JSONSchema7;
};

/**
 * Extends the base ContextTool interface from Tambo AI to include schema information
 * for parameter validation.
 */
export interface ComponentContextToolMetadata
  extends TamboAI.ComponentContextToolMetadata {
  parameters: ParameterSpec[];
  /**
   * Optional per-tool call limit. When set, this overrides the project's
   * global tool call limit for this specific tool.
   *
   * This is useful for tools that should only be called once or twice
   * regardless of the project's global limit.
   */
  maxCalls?: number;
  /**
   * Annotations describing the tool's behavior. See {@link ToolAnnotations}.
   */
  annotations?: ToolAnnotations;
}

export interface ComponentContextTool {
  getComponentContext: (...args: any[]) => Promise<any>;
  definition: ComponentContextToolMetadata;
}

export interface RegisteredComponent extends TamboAI.AvailableComponent {
  component: ComponentType<any>;
  loadingComponent?: ComponentType<any>;
}

export type ComponentRegistry = Record<string, RegisteredComponent>;

export type TamboToolRegistry = Record<string, TamboTool>;

/**
 * A JSON Schema that is compatible with the MCP.
 * This is a simplified JSON Schema that is compatible with the MCPClient and the tool's inputSchema.
 *
 * Do not export this type from the SDK.
 */
export type JSONSchemaLite = JSONSchema7 & {
  description?: string;
};

type MaybeAsync<T> = T | Promise<T>;

/**
 * TamboTool is a type that represents a tool that can be registered with Tambo.
 *
 * It is preferable to use the `defineTool` helper function to create tools, as
 * it provides better type inference and safety.
 * @example
 * ```ts
 * import { TamboTool, defineTool } from "@tambo-ai/react";
 * import { z } from "zod";
 *
 * const locationToLatLon = defineTool({
 *   name: "location_to_latlon",
 *   description:
 *     "Fetch latitude and longitude from a location string. Returns an object with 'lat' and 'lon' properties.",
 *   tool: async ({ location }) => getLatLonFromLocation(location),
 *   inputSchema: z.object({
 *     location: z.string(),
 *   }),
 *   outputSchema: z.object({
 *     lat: z.number(),
 *     lon: z.number(),
 *   }),
 * });
 * ```
 */
export interface TamboTool<
  Params = any,
  Returns = any,
  Rest extends any[] = [],
> {
  /**
   * Unique identifier for the tool
   */
  name: string;
  /**
   * Description of what the tool does - used by AI to determine when to use it
   */
  description: string;
  /**
   * Optional human-readable name of the tool for display purposes.
   */
  title?: string;
  /**
   * Optional limit for how many times this tool may be called while
   * generating a single response. If present, this value overrides the
   * project's global `maxToolCallLimit` for this tool.
   * @example 1
   */
  maxCalls?: number;
  /**
   * Annotations describing the tool's behavior, aligned with the MCP specification.
   * Use `tamboStreamableHint: true` to enable streaming execution of partial tool calls.
   * @see {@link ToolAnnotations}
   * @example
   * ```ts
   * const setTextTool: TamboTool<{ text: string }> = {
   *   name: "set_text",
   *   description: "Set the displayed text",
   *   annotations: {
   *     tamboStreamableHint: true, // tool is safe for streaming calls
   *   },
   *   tool: ({ text }) => setText(text),
   *   inputSchema: z.object({ text: z.string() }),
   *   outputSchema: z.void(),
   * };
   * ```
   */
  annotations?: ToolAnnotations;

  /**
   * The function that implements the tool's logic. This function will be called
   * by Tambo when the model decides to invoke the tool.
   * @param params - The input parameters for the tool. These are validated
   * against the inputSchema before being passed so are guaranteed to be correct
   * when called by the model.
   * @returns The result of the tool execution, which can be a value or a
   * Promise resolving to a value
   */
  tool: (params: Params, ...rest: Rest) => MaybeAsync<Returns>;

  /**
   * The schema for the tool's input parameters. This can be a validator from
   * any Standard Schema compliant library (Zod 3.24+, Zod 4.x) or a
   * raw JSON Schema object.
   *
   * This schema is used to validate and parse the parameters before passing
   * them to the tool function.
   */
  inputSchema: SupportedSchema<Params>;

  /**
   * The schema for the tool's output/return value. This can be any Standard Schema
   * compliant validator (Zod 3.24+, Zod 4.x) or a raw JSON Schema object.
   *
   * This is used to inform the model about the structure of the tool's return value
   * and is not used for runtime validation at this stage.
   */
  outputSchema: SupportedSchema<Returns>;

  /**
   * Optional function to transform the tool's return value into an array of content parts.
   * If not provided, the return value will be converted to a string and wrapped in a text content part.
   * @param result - The result returned by the tool function
   * @returns An array of content parts to be sent back to the AI
   */
  transformToContent?: (
    result: any,
  ) =>
    | Promise<TamboAI.Beta.Threads.ChatCompletionContentPart[]>
    | TamboAI.Beta.Threads.ChatCompletionContentPart[];
}

/**
 * A tool that uses JSON Schema compliant input and output schemas.
 * This does not provide type safety for the tool's parameters and return value.
 * @internal
 */
export type TamboToolJSONSchema<
  Args extends unknown[] = unknown[],
  Returns = unknown,
> = Omit<TamboTool<Args, Returns>, "tool" | "inputSchema" | "outputSchema"> & {
  tool: (...args: Args) => MaybeAsync<Returns>;
  inputSchema: JSONSchemaLite;
  outputSchema: JSONSchemaLite;
};

/**
 * A tool that could not be matched to any known schema types.
 * This means type safety cannot be guaranteed.
 * @internal
 */
export type TamboToolUnknown = Omit<
  TamboTool,
  "tool" | "inputSchema" | "outputSchema"
> & {
  tool: (...args: unknown[]) => MaybeAsync<unknown>;
  inputSchema: SupportedSchema;
  outputSchema: SupportedSchema;
};

/**
 * A tool that uses Standard Schema compliant input and output schemas.
 * This provides full type safety for the tool's parameters and return value.
 * @internal
 */
export type TamboToolStandardSchema<
  Input extends StandardSchemaV1 = StandardSchemaV1,
  Output extends StandardSchemaV1 = StandardSchemaV1,
> = Omit<
  TamboTool<
    StandardSchemaV1.InferOutput<Input>,
    StandardSchemaV1.InferOutput<Output>
  >,
  "tool" | "inputSchema" | "outputSchema"
> & {
  tool: (
    ...args: [StandardSchemaV1.InferOutput<Input>]
  ) => MaybeAsync<StandardSchemaV1.InferOutput<Output>>;
  inputSchema: Input;
  outputSchema: Output;
};

/**
 * If you're seeing this type, it means that you are using a deprecated and now
 * unsupported schema type for defining Tambo tools.
 *
 * Follow the migration guide to update your tool definitions to use
 * inputSchema and outputSchema with either Standard Schema compliant validators
 * (like Zod 3.25.76, Zod 4.x) or raw JSON Schema objects.
 * @deprecated replace `toolSchema` with `inputSchema` and `outputSchema` instead.
 * @see {@link https://docs.tambo.ai/api-reference/migration/toolschema}
 */
export type UnsupportedSchemaTamboTool = Omit<
  TamboTool,
  "tool" | "inputSchema" | "outputSchema"
> & {
  /**
   * @deprecated replace `toolSchema` with `inputSchema` and `outputSchema` instead.
   */
  toolSchema: any;
  tool: (...args: any[]) => MaybeAsync<any>;
  inputSchema?: never;
  outputSchema?: never;
};

export type TamboToolAssociations = Record<string, string[]>;
/**
 * A component that can be registered with the TamboRegistryProvider.
 */

export interface TamboComponent {
  /** The name of the component */
  name: string;
  /** The description of the component */
  description: string;
  /**
   * The React component to render.
   *
   * Make sure to pass the Component itself, not an instance of the component. For example,
   * if you have a component like this:
   *
   * ```tsx
   * const MyComponent = () => {
   *   return <div>My Component</div>;
   * };
   * ```
   *
   * You should pass the `Component`:
   *
   * ```tsx
   * const components = [MyComponent];
   * <TamboRegistryProvider components={components} />
   * ```
   */
  component: ComponentType<any>;

  /**
   * Schema describing the component's props. Accepts any Standard Schema
   * compliant validator (Zod, Valibot, ArkType, etc.) or a raw JSON Schema
   * object.
   *
   * Either this or propsDefinition must be provided, but not both.
   * @example
   * ```typescript
   * import { z } from "zod/v4";
   *
   * const component: TamboComponent = {
   *   name: "MyComponent",
   *   description: "A sample component",
   *   component: MyComponent,
   *   propsSchema: z.object({
   *     title: z.string(),
   *     count: z.number().optional()
   *   })
   * };
   * ```
   */
  propsSchema?: SupportedSchema;
  /**
   * The props definition of the component as a JSON object.
   * Either this or propsSchema must be provided, but not both.
   * @deprecated Use propsSchema instead.
   */
  propsDefinition?: any;
  /** The loading component to render while the component is loading */
  loadingComponent?: ComponentType<any>;
  /** The tools that are associated with the component */
  associatedTools?: TamboTool[];
  /** Annotations describing the component's behavior. */
  annotations?: ToolAnnotations;
}

type OptionalSchemaProps<T> = Omit<T, "inputSchema" | "outputSchema"> & {
  inputSchema?: T extends { inputSchema: infer I } ? I : never;
  outputSchema?: T extends { outputSchema: infer O } ? O : never;
};

/**
 * Registers one or more Tambo tools.
 * @param tools - An array of Tambo tools to register
 * @param warnOnOverwrite - Whether to warn if any tool is being overwritten
 */
export interface RegisterToolsFn {
  /**
   * @deprecated Follow the {@link https://docs.tambo.ai/api-reference/migration/toolschema | Migration Guide} to update
   * your tool definitions to use `inputSchema` and `outputSchema` instead.
   */
  (tools: UnsupportedSchemaTamboTool[], warnOnOverwrite?: boolean): void;
  /**
   * Register one or more Tambo tools. For better type inference, consider registering tools individually using the
   * `registerTool` function or use the `defineTool` helper when defining your tools.
   * @example
   * ```typescript
   * import { defineTool } from "@tambo-ai/react";
   * const tools = [
   *   defineTool({...});
   *   defineTool({...});
   * ];
   * registerTools(tools);
   * @param tools - An array of Tambo tools to register
   * @param warnOnOverwrite - Whether to warn if any tool is being overwritten
   */
  (tools: TamboTool[], warnOnOverwrite?: boolean): void;
}

/**
 * Function interface for registering a Tambo tool with full type inference.
 * This function has multiple overloads to handle different schema types. This
 * is a utility function and does not perform any runtime logic.
 */
export interface RegisterToolFn {
  <Args extends StandardSchemaV1, Returns extends StandardSchemaV1>(
    tool: TamboToolStandardSchema<Args, Returns>,
    warnOnOverwrite?: boolean,
  ): void;
  <Args extends any[], Returns = any>(
    tool: TamboToolJSONSchema<Args, Returns>,
    warnOnOverwrite?: boolean,
  ): void;
  (tool: TamboToolUnknown, warnOnOverwrite?: boolean): void;
  (tool: TamboTool, warnOnOverwrite?: boolean): void;
  /**
   * @deprecated Follow the {@link https://docs.tambo.ai/api-reference/migration/toolschema | Migration Guide} to update
   * your tool definitions to use `inputSchema` and `outputSchema` instead.
   * @param tool - The unsupported schema Tambo tool to register
   * @param warnOnOverwrite - Whether to warn if the tool is being overwritten
   */
  (tool: UnsupportedSchemaTamboTool, warnOnOverwrite?: boolean): void;
}

/**
 * Function interface for defining a Tambo tool with full type inference. This function has multiple overloads to handle
 * different schema types. This is a utility function and does not perform any runtime logic.
 */
export interface DefineToolFn {
  /**
   * @deprecated Follow the {@link https://docs.tambo.ai/api-reference/migration/toolschema | Migration Guide} to update
   * your tool definitions to use `inputSchema` and `outputSchema` instead.
   * @param tool The tool definition to register
   * @returns The registered tool definition
   */
  (tool: UnsupportedSchemaTamboTool): typeof tool;
  /**
   * Provides type safety for defining a Tambo Tool.
   *
   * Tambo uses the [standard-schema.dev](https://standard-schema.dev) spec which means you can use any Standard Schema
   * compliant validator (Zod 3.24+, Zod 4.x). This definition ensures the input and output types are correctly
   * inferred from the provided schemas.
   * @example
   * ```typescript
   * import { z } from "zod/v4";
   *
   * const myTool = defineTool({
   *   name: "myTool",
   *   description: "An example tool",
   *   inputSchema: z.object({
   *     input: z.string().describe("Input description")
   *   }),
   *   outputSchema: z.number().describe("Result description"),
   *   tool: ({ input }) => input.length,
   * });
   * ```
   * @see {@link https://standard-schema.dev/}
   * @param tool The tool definition to register
   * @returns The registered tool definition
   */
  <Input extends StandardSchemaV1, Output extends StandardSchemaV1>(
    tool: OptionalSchemaProps<TamboToolStandardSchema<Input, Output>>,
  ): TamboToolStandardSchema<Input, Output>;
  /**
   * Provides type safety for defining a Tambo Tool with JSON Schema input and output.
   *
   * This overload is used when providing raw JSON Schema objects instead of StandardSchema validators.
   * Type inference is limited when using raw JSON Schema.
   * @see {@link https://standard-schema.dev/}
   * @param tool The tool definition to register
   * @returns The registered tool definition
   */
  <I extends any[], O = any>(
    tool: OptionalSchemaProps<TamboToolJSONSchema<I, O>>,
  ): TamboToolJSONSchema<I, O>;
  /**
   * Provides type safety for defining a Tambo Tool.
   *
   * This overload is used when the schema types could not be matched to known types.
   * Type safety cannot be guaranteed.
   * @param tool The tool definition to register
   * @returns The registered tool definition
   */
  (tool: OptionalSchemaProps<TamboToolUnknown>): TamboToolUnknown;
  /**
   * Provides type safety for defining a Tambo Tool.
   *
   * This overload is used when providing a fully defined TamboTool.
   * @param tool The tool definition to register
   * @returns The registered tool definition
   */
  (tool: OptionalSchemaProps<TamboTool>): TamboTool;
}
