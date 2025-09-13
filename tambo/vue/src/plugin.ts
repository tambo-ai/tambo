import { App } from "vue";
import { installVueQuery, provideTamboClient, TamboClientProviderProps, TamboClientKey } from "./providers/tambo-client-provider";
import { provideTamboRegistry, TamboRegistryProviderProps, TamboRegistryKey } from "./providers/tambo-registry-provider";
import { provideTamboContextHelpers, TamboContextHelpersProviderProps, TamboContextHelpersKey } from "./providers/tambo-context-helpers-provider";
import { provideTamboThread, TamboThreadKey, TamboGenerationStageKey } from "./providers/tambo-thread-provider";
import { provideTamboInteractable, TamboInteractableKey } from "./providers/tambo-interactable-provider";
import { provideTambo, TamboKey } from "./providers/tambo-provider";

export interface TamboPluginOptions
  extends TamboClientProviderProps,
    TamboRegistryProviderProps,
    TamboContextHelpersProviderProps {
  streaming?: boolean;
}

export const TamboPlugin = {
  install(app: App, options: TamboPluginOptions) {
    const clientCtx = provideTamboClient(options);
    installVueQuery(app, clientCtx.queryClient);
    const registryCtx = provideTamboRegistry({ components: options.components, tools: options.tools, onCallUnregisteredTool: (options as any).onCallUnregisteredTool });
    const helpersCtx = provideTamboContextHelpers({ contextHelpers: options.contextHelpers });
    const threadCtx = provideTamboThread({ streaming: options.streaming });
    const interactableCtx = provideTamboInteractable();
    provideTambo(options);
    // expose keys for advanced use
    app.provide(TamboClientKey, clientCtx);
    app.provide(TamboRegistryKey, registryCtx);
    app.provide(TamboContextHelpersKey, helpersCtx);
    app.provide(TamboThreadKey, threadCtx);
    app.provide(TamboGenerationStageKey, {
      generationStage: (threadCtx as any).generationStage,
      generationStatusMessage: (threadCtx as any).generationStatusMessage,
      isIdle: (threadCtx as any).isIdle,
    } as any);
    app.provide(TamboInteractableKey, interactableCtx);
    app.provide(TamboKey, {
      ...clientCtx,
      ...registryCtx,
      ...helpersCtx,
      ...threadCtx,
      ...interactableCtx,
    } as any);
  },
};

