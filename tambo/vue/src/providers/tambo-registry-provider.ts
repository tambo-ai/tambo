import { defineComponent, h, provide, reactive, toRefs, inject } from "vue";
import { ZodSchema } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import {
  type ComponentRegistry,
  type TamboComponent,
  type TamboTool,
} from "../model/component-metadata";
import { assertNoZodRecord } from "../util/validate-zod-schema";
import { TAMBO_REGISTRY_CTX, type TamboRegistryContext } from "./injection-keys";

export interface TamboRegistryProviderProps {
  components?: TamboComponent[];
  tools?: TamboTool[];
  onCallUnregisteredTool?: (toolName: string, args: any[]) => Promise<string>;
}

export const TamboRegistryProvider = defineComponent<TamboRegistryProviderProps>({
  name: "TamboRegistryProvider",
  props: {
    components: { type: Array as any, required: false, default: undefined },
    tools: { type: Array as any, required: false, default: undefined },
    onCallUnregisteredTool: { type: Function as any, required: false },
  },
  setup(props, { slots }) {
    const state = reactive({
      componentList: {} as ComponentRegistry,
      toolRegistry: {} as Record<string, TamboTool>,
      componentToolAssociations: {} as Record<string, string[]>,
    });

    const registerTool = (tool: TamboTool, warnOnOverwrite = true) => {
      if ((tool as any).toolSchema && isZodSchema((tool as any).toolSchema)) {
        assertNoZodRecord((tool as any).toolSchema as any, `toolSchema of tool "${tool.name}"`);
      }
      if (state.toolRegistry[tool.name] && warnOnOverwrite) {
        console.warn(`Overwriting tool ${tool.name}`);
      }
      state.toolRegistry[tool.name] = tool;
    };

    const registerTools = (tools: TamboTool[], warnOnOverwrite = true) => {
      tools.forEach((t) => registerTool(t, warnOnOverwrite));
    };

    const addToolAssociation = (componentName: string, tool: TamboTool) => {
      if (!state.componentList[componentName]) {
        throw new Error(`Component ${componentName} not found in registry`);
      }
      state.componentToolAssociations[componentName] = [
        ...(state.componentToolAssociations[componentName] || []),
        tool.name,
      ];
    };

    const registerComponent = (
      options: TamboComponent,
      warnOnOverwrite = true,
    ) => {
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
          `Component ${name} cannot have both propsSchema and propsDefinition defined`,
        );
      }
      if (propsSchema && isZodSchema(propsSchema as any)) {
        assertNoZodRecord(propsSchema as any, `propsSchema of component "${name}"`);
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

    // hydrate initial
    props.components?.forEach((c) => registerComponent(c, false));
    props.tools && registerTools(props.tools, false);

    const value: TamboRegistryContext = {
      ...toRefs(state),
      componentList: state.componentList,
      toolRegistry: state.toolRegistry,
      componentToolAssociations: state.componentToolAssociations,
      registerComponent,
      registerTool,
      registerTools,
      addToolAssociation,
      onCallUnregisteredTool: props.onCallUnregisteredTool,
    } as any;

    provide(TAMBO_REGISTRY_CTX, value);
    return () => slots.default ? slots.default() : h("div");
  },
});

export function useTamboRegistry() {
  const ctx = inject(TAMBO_REGISTRY_CTX) as TamboRegistryContext | undefined;
  if (!ctx) throw new Error("useTamboRegistry must be used within a TamboRegistryProvider");
  return ctx;
}

function getSerializedProps(propsDefinition: any, propsSchema: any, name: string) {
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
    propsSchema && typeof propsSchema === "object" && propsSchema.type === "object" && propsSchema.properties
  );
}

function isZodSchema(obj: unknown): obj is ZodSchema {
  if (obj instanceof ZodSchema) return true;
  return (
    typeof obj === "object" && obj !== null && typeof (obj as any).safeParse === "function" && typeof (obj as any)._def === "object"
  );
}

