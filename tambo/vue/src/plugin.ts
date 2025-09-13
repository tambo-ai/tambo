import { App } from "vue";
import { installVueQuery, TamboClientProviderProps, TamboClientKey, createTamboClientContext } from "./providers/tambo-client-provider";
import { TamboKey } from "./providers/tambo-provider";
import { TamboRegistryKey, createTamboRegistryContext } from "./providers/tambo-registry-provider";
import { TamboContextHelpersKey, createTamboContextHelpersContext } from "./providers/tambo-context-helpers-provider";
// Thread and interactables must be provided from within setup() to use inject safely.

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
    app.provide(TamboClientKey, clientCtx);
    app.provide(TamboRegistryKey, registryCtx);
    app.provide(TamboContextHelpersKey, helpersCtx);
    app.provide(TamboKey, { ...clientCtx, ...registryCtx, ...helpersCtx } as any);
  },
};

