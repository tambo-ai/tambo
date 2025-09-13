import TamboAI, { ClientOptions } from "@tambo-ai/typescript-sdk";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { App, InjectionKey, Ref, computed, inject, provide, ref } from "vue";

export interface TamboClientProviderProps {
  tamboUrl?: string;
  apiKey: string;
  environment?: "production" | "staging";
  userToken?: string;
}

export interface TamboClientContextProps {
  client: TamboAI;
  queryClient: QueryClient;
  isUpdatingToken: Ref<boolean>;
}

export const TamboClientKey: InjectionKey<TamboClientContextProps> = Symbol(
  "TamboClientContext",
);

export function installVueQuery(app: App, queryClient: QueryClient) {
  app.use(VueQueryPlugin, { queryClient });
}

export function createTamboClientContext(
  props: TamboClientProviderProps,
): TamboClientContextProps {
  const tamboConfig: ClientOptions = {
    apiKey: props.apiKey,
    defaultHeaders: {
      "X-Tambo-Vue-Version": "0.1.0",
    },
  };
  if (props.tamboUrl) tamboConfig.baseURL = props.tamboUrl;
  if (props.environment) tamboConfig.environment = props.environment;

  const client = new TamboAI(tamboConfig);
  const queryClient = new QueryClient();
  const isUpdatingToken = ref<boolean>(false);

  // TODO: Port session token refresh logic to Vue when available
  // Placeholder reactive state for parity with React's useTamboSessionToken
  isUpdatingToken.value = false;

  return { client, queryClient, isUpdatingToken };
}

export function provideTamboClient(props: TamboClientProviderProps) {
  const context = createTamboClientContext(props);
  provide(TamboClientKey, context);
  return context;
}

export function useTamboClient() {
  const ctx = inject(TamboClientKey);
  if (!ctx) throw new Error("useTamboClient must be used after provideTamboClient");
  return ctx.client;
}

export function useTamboQueryClient() {
  const ctx = inject(TamboClientKey);
  if (!ctx)
    throw new Error("useTamboQueryClient must be used after provideTamboClient");
  return ctx.queryClient;
}

export function useIsTamboTokenUpdating() {
  const ctx = inject(TamboClientKey);
  if (!ctx)
    throw new Error(
      "useIsTamboTokenUpdating must be used after provideTamboClient",
    );
  return computed(() => ctx.isUpdatingToken.value);
}

