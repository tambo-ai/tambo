import { defineComponent, h, inject, provide, reactive } from "vue";
import type { ContextHelpers } from "../context-helpers/types";
import { resolveAdditionalContext } from "../context-helpers/registry";
import { TAMBO_CONTEXT_HELPERS_CTX, type TamboContextHelpersContextProps } from "./injection-keys";

export interface TamboContextHelpersProviderProps {
  contextHelpers?: ContextHelpers;
}

export const TamboContextHelpersProvider = defineComponent<TamboContextHelpersProviderProps>({
  name: "TamboContextHelpersProvider",
  props: {
    contextHelpers: { type: Object as any, required: false },
  },
  setup(props, { slots }) {
    const helpers = reactive<Record<string, (...args: any[]) => any>>({});

    const addContextHelper = (name: string, fn: (...args: any[]) => any) => {
      helpers[name] = fn;
    };
    const removeContextHelper = (name: string, fn?: (...args: any[]) => any) => {
      const registered = helpers[name];
      if (!fn || registered === fn) {
        delete helpers[name];
      }
    };

    if (props.contextHelpers) {
      for (const [name, fn] of Object.entries(props.contextHelpers)) {
        addContextHelper(name, fn);
      }
    }

    const getAdditionalContext = async () => {
      return (await resolveAdditionalContext(helpers)) as { name: string; context: any }[];
    };

    const getContextHelpers = () => helpers as ContextHelpers;

    const value: TamboContextHelpersContextProps = {
      getAdditionalContext,
      getContextHelpers,
      addContextHelper,
      removeContextHelper,
    };

    provide(TAMBO_CONTEXT_HELPERS_CTX, value);
    return () => (slots.default ? slots.default() : h("div"));
  },
});

export function useTamboContextHelpers() {
  const ctx = inject(TAMBO_CONTEXT_HELPERS_CTX);
  if (!ctx) throw new Error("No provider found");
  return ctx;
}

