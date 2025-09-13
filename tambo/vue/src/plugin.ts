import { App } from "vue";
import { installVueQuery, TamboClientProviderProps, TamboClientKey, createTamboClientContext } from "./providers/tambo-client-provider";
import { TamboKey } from "./providers/tambo-provider";
import { TamboRegistryKey, createTamboRegistryContext } from "./providers/tambo-registry-provider";
import { TamboContextHelpersKey, createTamboContextHelpersContext } from "./providers/tambo-context-helpers-provider";
import { TamboThreadKey, TamboGenerationStageKey, createTamboThreadContext } from "./providers/tambo-thread-provider";
import { TamboInteractableKey, provideTamboInteractable } from "./providers/tambo-interactable-provider";

export interface TamboPluginOptions extends TamboClientProviderProps {
  streaming?: boolean;
  components?: any[];
  tools?: any[];
  contextHelpers?: Record<string, any>;
  onCallUnregisteredTool?: (toolName: string, args: any[]) => Promise<string>;
}

export const TamboPlugin = {
  install(app: App, options: TamboPluginOptions) {
    const clientCtx = createTamboClientContext(options);
    installVueQuery(app, clientCtx.queryClient);
    const registryCtx = createTamboRegistryContext({ components: options.components, tools: options.tools, onCallUnregisteredTool: options.onCallUnregisteredTool as any });
    const helpersCtx = createTamboContextHelpersContext({ contextHelpers: options.contextHelpers });
    const { threadCtx, generationCtx } = createTamboThreadContext({ streaming: options.streaming });
    const interactableCtx = provideTamboInteractable();

    app.provide(TamboClientKey, clientCtx);
    app.provide(TamboRegistryKey, registryCtx);
    app.provide(TamboContextHelpersKey, helpersCtx);
    app.provide(TamboThreadKey, threadCtx);
    app.provide(TamboGenerationStageKey, generationCtx);
    app.provide(TamboInteractableKey, interactableCtx);
    app.provide(TamboKey, { ...clientCtx, ...registryCtx, ...helpersCtx, ...threadCtx, ...interactableCtx } as any);
  },
};

