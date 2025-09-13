import { InjectionKey, inject, provide, reactive } from "vue";
import { AdditionalContext, ContextHelperFn, ContextHelpers } from "../context-helpers/types";
import { resolveAdditionalContext } from "../context-helpers/registry";

export interface TamboContextHelpersProviderProps {
  contextHelpers?: ContextHelpers;
}

export interface TamboContextHelpersContextProps {
  getAdditionalContext: () => Promise<AdditionalContext[]>;
  getContextHelpers: () => ContextHelpers;
  addContextHelper: (name: string, helper: ContextHelperFn) => void;
  removeContextHelper: (name: string) => void;
}

export const TamboContextHelpersKey: InjectionKey<TamboContextHelpersContextProps> = Symbol(
  "TamboContextHelpersContext",
);

export function provideTamboContextHelpers(
  props: TamboContextHelpersProviderProps = {},
) {
  const helpers = reactive<Record<string, ContextHelperFn>>({});

  const addContextHelper = (name: string, fn: ContextHelperFn) => {
    helpers[name] = fn;
  };
  const removeContextHelper = (name: string, fn?: ContextHelperFn) => {
    const registeredFn = helpers[name];
    if (fn === undefined || registeredFn === fn) {
      delete helpers[name];
    }
  };

  if (props.contextHelpers) {
    for (const [name, fn] of Object.entries(props.contextHelpers)) {
      addContextHelper(name, fn);
    }
  }

  const getAdditionalContext = async () => {
    const contexts = await resolveAdditionalContext(helpers);
    return contexts as AdditionalContext[];
  };

  const getContextHelpers = () => helpers as ContextHelpers;

  const ctx: TamboContextHelpersContextProps = {
    getAdditionalContext,
    getContextHelpers,
    addContextHelper,
    removeContextHelper,
  };

  provide(TamboContextHelpersKey, ctx);
  return ctx;
}

export function useTamboContextHelpers() {
  const ctx = inject(TamboContextHelpersKey);
  if (!ctx) {
    return {
      getAdditionalContext: async () => {
        throw new Error("No provider found");
      },
      getContextHelpers: () => {
        throw new Error("No provider found");
      },
      addContextHelper: (_name: string, _helper: ContextHelperFn) => {
        throw new Error("No provider found");
      },
      removeContextHelper: (_name: string) => {
        throw new Error("No provider found");
      },
    } as TamboContextHelpersContextProps;
  }
  return ctx;
}

