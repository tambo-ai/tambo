import { App } from "vue";
import { installVueQuery, TamboClientProviderProps, TamboClientKey, createTamboClientContext } from "./providers/tambo-client-provider";
import { TamboKey } from "./providers/tambo-provider";

export interface TamboPluginOptions extends TamboClientProviderProps {
  streaming?: boolean;
}

export const TamboPlugin = {
  install(app: App, options: TamboPluginOptions) {
    const clientCtx = createTamboClientContext(options);
    installVueQuery(app, clientCtx.queryClient);
    app.provide(TamboClientKey, clientCtx);
    app.provide(TamboKey, clientCtx as any);
  },
};

