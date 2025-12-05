import type { StandardSchemaV1 } from "@standard-schema/spec";
import TamboAI from "@tambo-ai/typescript-sdk";
import { JSONSchema7 } from "json-schema";
import { ComponentType } from "react";
import {
  z as z3,
  ZodFunction as Zod3Function,
  ZodTuple,
  ZodType,
} from "zod/v3";

/**
 * A schema type that accepts either a Standard Schema compliant validator
 * (e.g., Zod, Valibot, ArkType) or a raw JSON Schema object.
 *
 * Standard Schema is a specification that provides a unified interface for
 * TypeScript validation libraries. Libraries like Zod implement this spec,
 * allowing us to accept any compliant validator without depending on a specific library.
 * @see https://standardschema.dev/
 */
export type TamboSchema<Args = unknown, Returns = Args> =
  | StandardSchemaV1<Args, Returns>
  | JSONSchema7;

type MaybeAsync<T> = T | Promise<T>;

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
 * This is a simplified JSON Schema that is compatible with the MCPClient and the toolSchema.
 *
 * Do not export this type from the SDK.
 */
export type JSONSchemaLite = JSONSchema7 & {
  description?: string;
};

/**
 * A tool that can be registered with Tambo and invoked by the AI.
 *
 * Tools allow the AI to perform actions and retrieve information. Each tool has:
 * - A unique name for identification
 * - A description that helps the AI understand when to use it
 * - A function that executes the tool's logic
 * - A schema describing the tool's parameters (Standard Schema or JSON Schema)
 * @example
 * ```typescript
 * import { z } from "zod/v4";
 *
 * const weatherTool: TamboTool = {
 *   name: "getWeather",
 *   description: "Get current weather for a location",
 *   tool: (location: string) => fetchWeather(location),
 *   toolSchema: {
 *     args: z.tuple([z.string().describe("Location name")]),
 *     returns: z.object({
 *       temperature: z.number(),
 *       conditions: z.string(),
 *     }),
 *   },
 * };
 * ```
 */
export interface TamboToolBase {
  /** Unique identifier for the tool */
  name: string;
  /** Description of what the tool does - used by AI to determine when to use it */
  description: string;
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
 * @deprecated Use TamboToolArgsReturns instead. z.function() will be removed in the next major version.
 */
export type TamboToolZod3Function<
  Args extends ZodTuple<any, any> = ZodTuple<any, any>,
  Returns extends ZodType = ZodType,
> = TamboToolBase & {
  tool: (...args: z3.infer<Args>) => MaybeAsync<z3.infer<Returns>>;
  toolSchema: Zod3Function<Args, Returns>;
};

/**
 * A tool schema format where args and returns are provided as separate schemas.
 * This format preserves tuple structure for Zod 4, unlike z.function() which loses it.
 * @example
 * ```typescript
 * import { z } from "zod/v4";
 *
 * const tool: TamboToolArgsReturns = {
 *   name: "greet",
 *   description: "Greet a person",
 *   tool: (name: string, age: number) => `Hello ${name}, you are ${age}`,
 *   toolSchema: {
 *     args: z.tuple([z.string().describe("Name"), z.number().describe("Age")]),
 *     returns: z.string(),
 *   },
 * };
 * ```
 */
export type TamboToolArgsReturns<
  Args extends StandardSchemaV1 = StandardSchemaV1,
  Returns extends StandardSchemaV1 = StandardSchemaV1,
> = TamboToolBase & {
  tool: (
    ...args: StandardSchemaV1.InferOutput<Args> extends any[]
      ? StandardSchemaV1.InferOutput<Args>
      : [StandardSchemaV1.InferOutput<Args>]
  ) => MaybeAsync<StandardSchemaV1.InferOutput<Returns>>;
  toolSchema: {
    args: Args;
    returns: Returns;
  };
};

export type TamboToolJSONSchema<
  Args extends unknown[] = unknown[],
  Returns = unknown,
> = TamboToolBase & {
  tool: (...args: Args) => MaybeAsync<Returns>;
  toolSchema: JSONSchemaLite;
};

export type TamboToolUnknownSchema = TamboToolBase & {
  tool: (...args: unknown[]) => MaybeAsync<unknown>;
  toolSchema: unknown;
};

/**
 * A tool that can be registered with Tambo and invoked by the AI.
 *
 * This is the public type used for storing and passing tools around.
 * The specific tool variants (TamboToolZod3Function, etc.) are used internally
 * for type inference when calling registerTool.
 */
export type TamboTool = TamboToolBase & {
  tool: (...args: any[]) => any;
  toolSchema: unknown;
};

export type InferArgsFromTamboTool<Tool> = Tool extends (
  ...args: infer Args
) => any
  ? Args
  : never;

export type InferReturnsFromTamboTool<Tool> = Tool extends (
  ...args: any[]
) => infer Returns
  ? Returns
  : never;

export type InferSchemaFromTamboTool<Tool> = Tool extends {
  toolSchema: infer Schema;
}
  ? Schema
  : never;

/**
 * Defines a TamboTool with the specified argument and return types. This is
 * doesn't perform any runtime validation; it simply helps with TypeScript type inference.
 * @example
 * ```typescript
 * import { z } from "zod/v4";
 *
 * const myTool = defineTamboTool({
 *   name: "myTool",
 *   description: "A sample tool",
 *   tool: (name: string, age: number) => `Hello ${name}, you are ${age}`,
 *   toolSchema: {
 *     args: z.tuple([z.string().describe("Name"), z.number().describe("Age")]),
 *     returns: z.string(),
 *   },
 * });
 * ```
 * @returns The defined TamboTool.
 */
export function defineTamboTool<
  Args extends StandardSchemaV1,
  Returns extends StandardSchemaV1,
>(
  tool: TamboToolArgsReturns<Args, Returns>,
): TamboToolArgsReturns<Args, Returns>;
/**
 * @deprecated Use TamboToolArgsReturns format instead. Support for zod/v3
 * z.function() will be removed in a future version.
 * @returns The defined TamboTool.
 */
export function defineTamboTool<
  Args extends ZodTuple<any, any>,
  Returns extends ZodType,
>(
  tool: TamboToolZod3Function<Args, Returns>,
): TamboToolZod3Function<Args, Returns>;
export function defineTamboTool(tool: TamboToolJSONSchema): TamboToolJSONSchema;
export function defineTamboTool(tool: TamboToolUnknownSchema): never;
export function defineTamboTool(
  tool: TamboToolUnknownSchema,
): TamboToolUnknownSchema {
  return tool;
}

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
   * Schema describing the component's props.
   * Accepts any Standard Schema compliant validator (Zod, Valibot, ArkType, etc.)
   * or a raw JSON Schema object.
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
  propsSchema?: TamboSchema;
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
}
