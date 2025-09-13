import type TamboAI from "@tambo-ai/typescript-sdk";
import { InjectionKey, inject, provide, reactive } from "vue";
import { ZodSchema } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import {
  ComponentRegistry,
  TamboComponent,
  TamboTool,
} from "../model/component-metadata";
import { assertNoZodRecord } from "../util/validate-zod-schema";

export interface TamboRegistryContext {
  componentList: ComponentRegistry;
  toolRegistry: Record<string, TamboTool>;
  componentToolAssociations: Record<string, string[]>;
  registerComponent: (options: TamboComponent) => void;
  registerTool: (tool: TamboTool) => void;
  registerTools: (tools: TamboTool[]) => void;
  addToolAssociation: (componentName: string, tool: TamboTool) => void;
  onCallUnregisteredTool?: (
    toolName: string,
    args: TamboAI.ToolCallParameter[],
  ) => Promise<string>;
}

export const TamboRegistryKey: InjectionKey<TamboRegistryContext> = Symbol(
  "TamboRegistryContext",
);

export interface TamboRegistryProviderProps {
  components?: TamboComponent[];
  tools?: TamboTool[];
  onCallUnregisteredTool?: (
    toolName: string,
    args: TamboAI.ToolCallParameter[],
  ) => Promise<string>;
}

export function provideTamboRegistry(props: TamboRegistryProviderProps = {}) {
  const state = reactive<{
    componentList: ComponentRegistry;
    toolRegistry: Record<string, TamboTool>;
    componentToolAssociations: Record<string, string[]>;
  }>({ componentList: {}, toolRegistry: {}, componentToolAssociations: {} });

  const registerTool = (tool: TamboTool, warnOnOverwrite = true) => {
    if (tool.toolSchema && isZodSchema(tool.toolSchema)) {
      assertNoZodRecord(tool.toolSchema, `toolSchema of tool "${tool.name}"`);
    }
    const existing = state.toolRegistry[tool.name];
    if (existing && warnOnOverwrite) {
      console.warn(`Overwriting tool ${tool.name}`);
    }
    state.toolRegistry[tool.name] = tool;
  };

  const registerTools = (tools: TamboTool[], warnOnOverwrite = true) => {
    tools.forEach((tool) => registerTool(tool, warnOnOverwrite));
  };

  const addToolAssociation = (componentName: string, tool: TamboTool) => {
    if (!state.componentList[componentName]) {
      throw new Error(`Component ${componentName} not found in registry`);
    }
    const arr = state.componentToolAssociations[componentName] || [];
    state.componentToolAssociations[componentName] = [...arr, tool.name];
  };

  const registerComponent = (options: TamboComponent, warnOnOverwrite = true) => {
    const {
      name,
      description,
      component,
      propsSchema,
      propsDefinition,
      loadingComponent,
      associatedTools,
    } = options;

    if (!propsSchema && !propsDefinition) {
      throw new Error(
        `Component ${name} must have either propsSchema (recommended) or propsDefinition defined`,
      );
    }
    if (propsSchema && propsDefinition) {
      throw new Error(
        `Component ${name} cannot have both propsSchema and propsDefinition defined. Use only one. We recommend using propsSchema.`,
      );
    }
    if (propsSchema && isZodSchema(propsSchema)) {
      assertNoZodRecord(propsSchema, `propsSchema of component "${name}"`);
    }

    const props = getSerializedProps(propsDefinition, propsSchema, name);

    if (state.componentList[name] && warnOnOverwrite) {
      console.warn(`overwriting component ${name}`);
    }
    state.componentList[name] = {
      component,
      loadingComponent,
      name,
      description,
      props,
      contextTools: [],
    } as any;

    if (associatedTools) {
      registerTools(associatedTools);
      state.componentToolAssociations[name] = associatedTools.map((t) => t.name);
    }
  };

  props.components?.forEach((c) => registerComponent(c, false));
  props.tools?.forEach((t) => registerTool(t, false));

  const ctx: TamboRegistryContext = {
    get componentList() {
      return state.componentList;
    },
    get toolRegistry() {
      return state.toolRegistry;
    },
    get componentToolAssociations() {
      return state.componentToolAssociations;
    },
    registerComponent,
    registerTool,
    registerTools,
    addToolAssociation,
    onCallUnregisteredTool: props.onCallUnregisteredTool,
  };

  provide(TamboRegistryKey, ctx);
  return ctx;
}

export function useTamboRegistry() {
  const ctx = inject(TamboRegistryKey);
  if (!ctx) throw new Error("useTamboRegistry must be used after provideTamboRegistry");
  return ctx;
}

function getSerializedProps(
  propsDefinition: any,
  propsSchema: any,
  name: string,
) {
  if (propsDefinition) {
    console.warn(`propsDefinition is deprecated. Use propsSchema instead.`);
    return propsDefinition;
  }
  if (isZodSchema(propsSchema)) {
    try {
      return zodToJsonSchema(propsSchema);
    } catch (error) {
      console.error(`Error converting ${name} props schema to JSON Schema:`, error);
    }
  }
  if (isJSONSchema(propsSchema)) {
    return propsSchema;
  }
  throw new Error(`Invalid props schema for ${name}`);
}

function isJSONSchema(propsSchema: any) {
  return (
    propsSchema &&
    typeof propsSchema === "object" &&
    propsSchema.type === "object" &&
    propsSchema.properties
  );
}

function isZodSchema(obj: unknown): obj is ZodSchema {
  if (obj instanceof ZodSchema) return true;
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any).safeParse === "function" &&
    typeof (obj as any)._def === "object"
  );
}

