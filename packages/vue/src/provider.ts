import { type InjectionKey, provide, inject, defineComponent, h, type PropType } from "vue";
import { TamboClient } from "@tambo-ai/typescript-sdk";

export interface TamboContext {
  client: TamboClient;
}

export interface TamboProviderProps {
  apiKey: string;
  apiUrl?: string;
}

const TAMBO_INJECTION_KEY: InjectionKey<TamboContext> = Symbol("tambo");

/**
 * Access the Tambo context provided by TamboProvider.
 * Must be called within a component that is a descendant of TamboProvider.
 */
export function useTamboContext(): TamboContext {
  const context = inject(TAMBO_INJECTION_KEY);
  if (!context) {
    throw new Error(
      "useTamboContext() must be used within a <TamboProvider>. " +
        "Wrap your component tree with <TamboProvider :api-key=\"...\">."
    );
  }
  return context;
}

/**
 * TamboProvider — Vue 3 component that provides the Tambo client
 * to all descendant components via Vue's provide/inject system.
 *
 * Usage:
 * ```vue
 * <TamboProvider :api-key="myApiKey">
 *   <MyApp />
 * </TamboProvider>
 * ```
 */
export const TamboProvider = defineComponent({
  name: "TamboProvider",
  props: {
    apiKey: {
      type: String as PropType<string>,
      required: true,
    },
    apiUrl: {
      type: String as PropType<string>,
      required: false,
    },
  },
  setup(props, { slots }) {
    const client = new TamboClient({
      apiKey: props.apiKey,
      ...(props.apiUrl ? { apiUrl: props.apiUrl } : {}),
    });

    const context: TamboContext = { client };
    provide(TAMBO_INJECTION_KEY, context);

    return () => slots.default?.();
  },
});
