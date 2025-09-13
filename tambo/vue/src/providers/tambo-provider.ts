import { defineComponent, h, inject, provide, type PropType } from "vue";
import {
  TAMBO_CLIENT_CTX,
  TAMBO_COMPONENT_CTX,
  TAMBO_CONTEXT_HELPERS_CTX,
  TAMBO_GEN_STAGE_CTX,
  TAMBO_REGISTRY_CTX,
  TAMBO_THREAD_CTX,
} from "./injection-keys";
import type {
  TamboClientContextProps,
  TamboComponentContextProps,
  TamboContextHelpersContextProps,
  TamboGenerationStageContextProps,
  TamboRegistryContext,
  TamboThreadContextProps,
} from "./injection-keys";
import { TamboClientProvider, type TamboClientProviderProps } from "./tambo-client-provider";
import { TamboComponentProvider } from "./tambo-component-provider";
import {
  TamboContextHelpersProvider,
  type TamboContextHelpersProviderProps,
} from "./tambo-context-helpers-provider";
import { TamboRegistryProvider, type TamboRegistryProviderProps } from "./tambo-registry-provider";
import { TamboThreadInputProvider, type TamboThreadInputProviderProps } from "./tambo-thread-input-provider";
import { TamboThreadProvider, type TamboThreadProviderProps } from "./tambo-thread-provider";
import { TamboInteractableProvider } from "./tambo-interactable-provider";

export type TamboProviderProps = TamboClientProviderProps &
  TamboRegistryProviderProps &
  TamboThreadProviderProps &
  TamboContextHelpersProviderProps &
  TamboThreadInputProviderProps;

export const TamboProvider = defineComponent<TamboProviderProps>({
  name: "TamboProvider",
  props: {
    tamboUrl: { type: String, required: false },
    apiKey: { type: String, required: true },
    environment: { type: String as PropType<"production" | "staging">, required: false },
    userToken: { type: String, required: false },
    components: { type: Array as any, required: false },
    tools: { type: Array as any, required: false },
    onCallUnregisteredTool: { type: Function as any, required: false },
    streaming: { type: Boolean, required: false, default: true },
    contextHelpers: { type: Object as any, required: false },
    contextKey: { type: String, required: false },
  },
  setup(props, { slots }) {
    if (typeof window === "undefined") {
      console.error("TamboProvider must be used within a browser");
    }
    return () =>
      h(
        TamboClientProvider,
        {
          tamboUrl: props.tamboUrl,
          apiKey: props.apiKey,
          environment: props.environment,
          userToken: props.userToken,
        },
        {
          default: () =>
            h(
              TamboRegistryProvider,
              {
                components: props.components as any,
                tools: props.tools as any,
                onCallUnregisteredTool: props.onCallUnregisteredTool as any,
              },
              {
                default: () =>
                  h(
                    TamboContextHelpersProvider,
                    { contextHelpers: props.contextHelpers },
                    {
                      default: () =>
                        h(
                          TamboThreadProvider,
                          { streaming: props.streaming },
                          {
                            default: () =>
                              h(
                                TamboThreadInputProvider,
                                { contextKey: props.contextKey },
                                {
                                  default: () =>
                                    h(TamboComponentProvider, {}, {
                                      default: () =>
                                        h(TamboInteractableProvider, {}, {
                                          default: () => h(TamboCompositeProvider, {}, { default: () => slots.default?.() }),
                                        }),
                                    }),
                                },
                              ),
                          },
                        ),
                    },
                  ),
              },
            ),
        },
      );
  },
});

export const TamboCompositeProvider = defineComponent({
  name: "TamboCompositeProvider",
  setup(_props, { slots }) {
    const client = inject<TamboClientContextProps>(TAMBO_CLIENT_CTX)!;
    const registry = inject<TamboRegistryContext>(TAMBO_REGISTRY_CTX)!;
    const thread = inject<TamboThreadContextProps>(TAMBO_THREAD_CTX)!;
    const component = inject<TamboComponentContextProps>(TAMBO_COMPONENT_CTX)!;
    const ctxHelpers = inject<TamboContextHelpersContextProps>(TAMBO_CONTEXT_HELPERS_CTX)!;
    const genStage = inject<TamboGenerationStageContextProps>(TAMBO_GEN_STAGE_CTX)!;

    provide(Symbol("TAMBO_CTX") as any, {
      ...client,
      ...registry,
      ...thread,
      ...component,
      ...ctxHelpers,
      ...genStage,
    });

    return () => (slots.default ? slots.default() : h("div"));
  },
});

export function useTambo() {
  // Aggregate by injecting individual slices as needed
  const client = inject<TamboClientContextProps>(TAMBO_CLIENT_CTX);
  const registry = inject<TamboRegistryContext>(TAMBO_REGISTRY_CTX);
  const thread = inject<TamboThreadContextProps>(TAMBO_THREAD_CTX);
  const component = inject<TamboComponentContextProps>(TAMBO_COMPONENT_CTX);
  const ctxHelpers = inject<TamboContextHelpersContextProps>(TAMBO_CONTEXT_HELPERS_CTX);
  const genStage = inject<TamboGenerationStageContextProps>(TAMBO_GEN_STAGE_CTX);
  if (!client || !registry || !thread || !component || !ctxHelpers || !genStage) {
    throw new Error("useTambo must be used within a TamboProvider");
  }
  return {
    ...client,
    ...registry,
    ...thread,
    ...component,
    ...ctxHelpers,
    ...genStage,
  };
}

