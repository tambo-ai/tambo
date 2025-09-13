import TamboAI from "@tambo-ai/typescript-sdk";
import { JSONSchema7 } from "json-schema";
import type { DefineComponent } from "vue";
import z from "zod";
import type zodToJsonSchema from "zod-to-json-schema";

export type ParameterSpec = TamboAI.ToolParameters & {
  schema?: ReturnType<typeof zodToJsonSchema>;
};

export interface ComponentContextToolMetadata
  extends TamboAI.ComponentContextToolMetadata {
  parameters: ParameterSpec[];
}

export interface ComponentContextTool {
  getComponentContext: (...args: any[]) => Promise<any>;
  definition: ComponentContextToolMetadata;
}

export interface RegisteredComponent extends TamboAI.AvailableComponent {
  component: DefineComponent<any, any, any> | any;
  loadingComponent?: DefineComponent<any, any, any> | any;
}

export type ComponentRegistry = Record<string, RegisteredComponent>;
export type TamboToolRegistry = Record<string, TamboTool>;

export type JSONSchemaLite = ReturnType<typeof zodToJsonSchema> & {
  description?: string;
};

export interface TamboTool<
  Args extends z.ZodTuple<any, any> = z.ZodTuple<any, any>,
  Returns extends z.ZodTypeAny = z.ZodTypeAny,
> {
  name: string;
  description: string;
  tool: (...args: z.infer<Args>) => z.infer<Returns>;
  toolSchema: z.ZodFunction<Args, Returns> | JSONSchemaLite;
}

export type TamboToolAssociations = Record<string, string[]>;

export interface TamboComponent {
  name: string;
  description: string;
  component: DefineComponent<any, any, any> | any;
  propsSchema?: z.ZodTypeAny | JSONSchema7;
  propsDefinition?: any;
  loadingComponent?: DefineComponent<any, any, any> | any;
  associatedTools?: TamboTool[];
}

