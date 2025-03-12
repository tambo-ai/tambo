import TamboAI from "@tambo-ai/typescript-sdk";
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
  toolSchema: z.ZodFunction<Args, Returns>;
}

export type TamboToolAssociations = Record<string, string[]>;
