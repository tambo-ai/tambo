import TamboAI from "@tambo-ai/typescript-sdk";
import { JSONSchema7 } from "json-schema";
import { ComponentType } from "react";
import z from "zod";
import type zodToJsonSchema from "zod-to-json-schema";
/** Extension of the ToolParameters interface from Tambo AI to include JSONSchema definition */
export type ParameterSpec = TamboAI.ToolParameters & {
  schema?: ReturnType<typeof zodToJsonSchema>;
};

/**
 * Extends the base ContextTool interface from Tambo AI to include schema information
 * for parameter validation using zod-to-json-schema.
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

export interface TamboTool<
  Args extends z.ZodTuple<any, any> = z.ZodTuple<any, any>,
  Returns extends z.ZodTypeAny = z.ZodTypeAny,
> {
  name: string;
  description: string;
  tool: (...args: z.infer<Args>) => z.infer<Returns>;
  inputSchema: z.ZodObject;
  outputSchema: z.ZodObject;
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
   * A zod schema for the component props. (Recommended)
   * Either this or propsDefinition must be provided, but not both.
   */
  propsSchema?: z.ZodTypeAny | JSONSchema7;
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
