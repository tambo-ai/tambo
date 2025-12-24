import type { StandardSchemaV1 } from "@standard-schema/spec";
import TamboAI from "@tambo-ai/typescript-sdk";
import { JSONSchema7 } from "json-schema";
import { ComponentType } from "react";
import {
  ZodFunction as Zod3Function,
  ZodTuple as Zod3FunctionArgs,
  ZodType as Zod3FunctionReturns,
  infer as Zod3Infer,
} from "zod/v3";
import {
  $ZodFunction as Zod4Function,
  $ZodFunctionArgs as Zod4FunctionArgs,
  $ZodType as Zod4FunctionReturns,
  infer as Zod4Infer,
} from "zod/v4/core";

/**
 * A schema type that accepts either a Standard Schema compliant validator
 * (e.g., Zod, Valibot, ArkType) or a raw JSON Schema object.
 *
 * Standard Schema is a specification that provides a unified interface for
 * TypeScript validation libraries. Libraries like Zod implement this spec,
 * allowing us to accept any compliant validator without depending on a specific library.
 * @see https://standardschema.dev/
 */
export type SupportedSchema<Shape = unknown> =
  | StandardSchemaV1<Shape, Shape>
  | JSONSchema7;

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

export type TamboToolRegistry = Record<
  string,
  TamboTool | TamboToolWithToolSchema
>;

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
 * Alternatively, you manually construct a TamboTool with type safety by passing
 * the expected parameter and return types as generics:
 * ```ts
 * import { TamboTool } from "@tambo-ai/react";
 * import { z } from "zod";
 *
 * const locationToLatLon: TamboTool<{ location: string }, { lat: number; lon: number }> = {
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
  //  * Optional properties describing tool behavior
  //  */
  annotations?: {
    /**
     * An array indicating the intended audience(s) for this resource. Valid
     * values are "user" and "assistant". For example, ["user", "assistant"]
     * indicates content useful for both.
     */
    audience: ("user" | "assistant")[];
    /**
     * A number from 0.0 to 1.0 indicating the importance of this resource. A
     * value of 1 means "most important" (effectively required), while 0 means
     * "least important" (entirely optional).
     */
    priority: number;
    /**
     * An ISO 8601 formatted timestamp indicating when the resource was last
     * modified (e.g., "2025-01-12T15:00:58Z").
     */
    lastModified: string;
  };

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
   * any Standard Schema compliant library (Zod, Valibot, ArkType, etc.) or a
   * raw JSON Schema object.
   *
   * This schema is used to validate and parse the parameters before passing
   * them to the tool function.
   */
  inputSchema: SupportedSchema | unknown;

  /**
   * The schema for the tool's output/return value. This can be any Standard Schema
   * compliant validator (Zod, Valibot, ArkType, etc.) or a raw JSON Schema object.
   *
   * This is used to inform the model about the structure of the tool's return value
   * and is not used for runtime validation at this stage.
   */
  outputSchema: SupportedSchema | unknown;

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
 * Simplified interface for tools using the deprecated toolSchema format.
 * This interface uses simple `any` types to avoid complex type instantiation.
 * Use `defineTamboTool()` for full type inference when creating tools.
 * @deprecated Use TamboTool with `inputSchema`/`outputSchema` instead.
 */
export type TamboToolWithToolSchema<
  Args extends any[] = any[],
  Returns = any,
> = Omit<TamboTool, "tool" | "inputSchema" | "outputSchema"> & {
  tool: (...args: Args) => MaybeAsync<Returns>;
  /** @deprecated Use `inputSchema`/`outputSchema` properties instead. */
  toolSchema: unknown;
};

// NOTE(lachieh): this comment mirrors the one from `TamboTool` above
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
 * Alternatively, you manually construct a TamboTool with type safety by passing
 * the expected parameter and return types as generics:
 * ```ts
 * import { TamboTool } from "@tambo-ai/react";
 * import { z } from "zod";
 *
 * const locationToLatLon: TamboTool<{ location: string }, { lat: number; lon: number }> = {
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
export type TamboToolBase<Params = any, Returns = any> =
  | TamboToolWithToolSchema
  | TamboTool<Params, Returns>;

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
  inputSchema: unknown;
  outputSchema: unknown;
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

type TamboToolZod3Function<
  Args extends Zod3FunctionArgs,
  Returns extends Zod3FunctionReturns,
> = Omit<
  TamboToolWithToolSchema<Zod3Infer<Args>, Zod3Infer<Returns>>,
  "toolSchema"
> & {
  tool: (...args: Zod3Infer<Args>) => MaybeAsync<Zod3Infer<Returns>>;
  /** @deprecated Use `inputSchema`/`outputSchema` properties instead. */
  toolSchema: Zod3Function<Args, Returns>;
};

type TamboToolZod4Function<
  Args extends Zod4FunctionArgs,
  Returns extends Zod4FunctionReturns,
> = Omit<
  TamboToolWithToolSchema<Zod4Infer<Args>, Zod4Infer<Returns>>,
  "toolSchema"
> & {
  tool: (...args: Zod4Infer<Args>) => MaybeAsync<Zod4Infer<Returns>>;
  /** @deprecated Use `inputSchema`/`outputSchema` properties instead. */
  toolSchema: Zod4Function<Args, Returns>;
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
  associatedTools?: (TamboTool | TamboToolWithToolSchema)[];
}

export interface RegisterToolsFn {
  /**
   * Registers one or more Tambo tools.
   * @param tools - An array of Tambo tools to register
   */
  (tools: TamboTool[]): void;
  (tools: (TamboTool | TamboToolWithToolSchema)[]): void;
}

/**
 * Function interface for registering a Tambo tool with full type inference.
 * This function has multiple overloads to handle different schema types. This
 * is a utility function and does not perform any runtime logic.
 */
export interface RegisterToolFn {
  /**
   * @deprecated Use `inputSchema`/`outputSchema` instead. toolSchema is deprecated
   * and will be removed in future versions.
   * @example
   * ```diff
   * import { z } from "zod/v3";
   * const myTool = defineTamboTool({
   *   ...
   * -  toolSchema: z.function()
   * -    .arguments(z.tuple([z.string()]))
   * -    .returns(z.number()),
   * +  inputSchema: z.object({
   * +    input: z.string().describe("Input description")
   * +  }),
   * +  outputSchema: z.number().describe("Result description"),
   * });
   */
  <Args extends Zod3FunctionArgs, Returns extends Zod3FunctionReturns>(
    tool: TamboToolZod3Function<Args, Returns>,
    warnOnOverwrite?: boolean,
  ): void;
  /**
   * @deprecated Use `inputSchema`/`outputSchema` instead. toolSchema is deprecated
   * and will be removed in future versions.
   * @example
   * ```diff
   * import { z } from "zod/v4";
   * const myTool = defineTamboTool({
   *   ...
   * -  toolSchema: z.function({
   * -    input: z.tuple([z.string()]),
   * -    output: z.number(),
   * -  }),
   * +  inputSchema: z.object({
   * +    input: z.string().describe("Input description")
   * +  }),
   * +  outputSchema: z.number().describe("Result description"),
   * });
   */
  <Args extends Zod4FunctionArgs, Returns extends Zod4FunctionReturns>(
    tool: TamboToolZod4Function<Args, Returns>,
    warnOnOverwrite?: boolean,
  ): void;
  (tool: TamboToolWithToolSchema, warnOnOverwrite?: boolean): void;
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
}

/**
 * Function interface for defining a Tambo tool with full type inference. This
 * function has multiple overloads to handle different schema types. This is a
 * utility function and does not perform any runtime logic.
 */
export interface DefineToolFn {
  /**
   * Provides type safety for defining a Tambo Tool.
   *
   * Tambo uses the [standard-schema.dev](https://standard-schema.dev) spec which means you can use any Standard Schema
   * compliant validator (Zod, Valibot, ArkType, etc.). This definition ensures the input and output types are correctly
   * inferred from the provided schemas.
   * @example
   * ```typescript
   * import { z } from "zod/v4";
   *
   * const myTool = defineTamboTool({
   *   // ...
   *   inputSchema: z.object({
   *     input: z.string().describe("Input description")
   *   }),
   *   outputSchema: z.number().describe("Result description"),
   * });
   * ```
   * @see {@link https://standard-schema.dev/}
   * @param tool The tool definition to register
   * @returns The registered tool definition
   */
  <Input extends StandardSchemaV1, Output extends StandardSchemaV1>(
    tool: TamboToolStandardSchema<Input, Output>,
  ): TamboToolStandardSchema<Input, Output>;
  /**
   * Provides type safety for defining a Tambo Tool.
   *
   * This tool uses the deprecated `toolSchema` format which uses a zod function schema. If you are using a validation
   * library that implements StandardSchema.dev, please switch to using separate `inputSchema` and `outputSchema`
   * properties instead. See example below.
   * @example
   * ```diff
   * import { z } from "zod/v4";
   *
   * const myTool = defineTamboTool({
   *   // ...
   * -  toolSchema: z.function({
   * -    input: z.tuple([z.string()]),
   * -    output: z.number(),
   * -  })
   * +  inputSchema: z.object({
   * +    input: z.string().describe("Input description")
   * +  }),
   * +  outputSchema: z.number().describe("Result description"),
   * });
   * @see {@link https://standard-schema.dev/}
   * @param tool The tool definition to register
   * @returns The registered tool definition
   * @deprecated Using `toolSchema` is deprecated. Please use separate `inputSchema` and `outputSchema` properties instead.
   * Note that use of `toolSchema` will be removed in a future release.
   * ```
   */
  <Args extends Zod3FunctionArgs, Returns extends Zod3FunctionReturns>(
    tool: TamboToolZod3Function<Args, Returns>,
  ): TamboToolZod3Function<Args, Returns>;
  /**
   * Provides type safety for defining a Tambo Tool.
   *
   * This tool uses the deprecated `toolSchema` format which uses a zod function schema. If you are using a validation
   * library that implements standard-schema.dev, please switch to using separate `inputSchema` and `outputSchema`
   * properties instead. See example below.
   * @param tool The tool definition to register
   * @returns The registered tool definition
   * @deprecated Using `toolSchema` is deprecated. Please use separate `inputSchema` and `outputSchema` properties instead.
   * Note that use of `toolSchema` will be removed in a future release.
   * @example
   * ```diff
   * import { z } from "zod/v4";
   *
   * const myTool = defineTamboTool({
   *   // ...
   * -  toolSchema: z.function({
   * -    input: z.tuple([z.string()]),
   * -    output: z.number(),
   * -  })
   * +  inputSchema: z.object({
   * +    input: z.string().describe("Input description")
   * +  }),
   * +  outputSchema: z.number().describe("Result description"),
   * });
   * ```
   */
  <Args extends Zod4FunctionArgs, Returns extends Zod4FunctionReturns>(
    tool: TamboToolZod4Function<Args, Returns>,
  ): TamboToolZod4Function<Args, Returns>;
  /**
   * Provides type safety for defining a Tambo Tool.
   *
   * This tool uses the deprecated `toolSchema` property which uses a zod function schema. If you are using a validation
   * library that implements standard-schema.dev, please switch to using separate `inputSchema` and `outputSchema`
   * properties instead. See example below.
   * @param tool The tool definition to register
   * @returns The registered tool definition
   * @deprecated Using `toolSchema` is deprecated. Please use separate `inputSchema` and `outputSchema` properties instead.
   * Note that use of `toolSchema` will be removed in a future release.
   * @example
   * ```diff
   * import { z } from "zod/v4";
   *
   * const myTool = defineTamboTool({
   *   // ...
   * -  toolSchema: { ... }
   * +  inputSchema: z.object({ ... }),
   * +  outputSchema: z.number(),
   * });
   * ```
   */
  (tool: TamboToolWithToolSchema): TamboToolWithToolSchema;
  /**
   * Provides type safety for defining a Tambo Tool.
   *
   * This tool definition matched to JSON Schema input and output schemas which allows does not guarantee type
   * safety. If you are using a validation library that implements
   * [Standard Schema](https://standardschema.dev/#what-tools-frameworks-accept-speccompliant-schemas), please ensure
   * your schemas are correctly typed.
   * @see {@link https://standard-schema.dev/}
   * @param tool The tool definition to register
   * @returns The registered tool definition
   */
  <I extends any[], O = any>(
    tool: TamboToolJSONSchema<I, O>,
  ): TamboToolJSONSchema<I, O>;
  /**
   * Provides type safety for defining a Tambo Tool.
   *
   * This tool definition could not be matched to any known schema types which means type safety cannot be
   * guaranteed. If you are using a validation library that implements
   * [Standard Schema](https://standardschema.dev/#what-tools-frameworks-accept-speccompliant-schemas), please ensure
   * your schemas are correctly typed.
   * @example
   * ```typescript
   * const myTool = defineTamboTool({
   *   name: "myTool",
   *   description: "An example tool",
   *   tool: (input) => { ... },
   *   inputSchema: yourInputSchema,
   *   outputSchema: yourOutputSchema,
   * });
   * @param tool The tool definition to register
   * @returns The registered tool definition
   * ```
   */
  (tool: TamboToolUnknown): TamboToolUnknown;
  (tool: TamboTool): TamboTool;
}
