import TamboAI, { type ClientOptions } from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/vue-query";
import { defineComponent, h, inject, provide, type PropType } from "vue";
import pkg from "../../package.json";
import { TAMBO_CLIENT_CTX, type TamboClientContextProps } from "./injection-keys";
import { useTamboSessionToken } from "./use-tambo-session-token";

export interface TamboClientProviderProps {
  tamboUrl?: string;
  apiKey: string;
  environment?: "production" | "staging";
  userToken?: string;
}

export const TamboClientProvider = defineComponent({
  name: "TamboClientProvider",
  props: {
    tamboUrl: { type: String, required: false },
    apiKey: { type: String, required: true },
    environment: { type: String as PropType<"production" | "staging">, required: false },
    userToken: { type: String, required: false },
  },
  setup(props, { slots }) {
    const tamboConfig: ClientOptions = {
      apiKey: props.apiKey,
      defaultHeaders: {
        "X-Tambo-Vue-Version": (pkg as any).version,
      },
    };
    if (props.tamboUrl) tamboConfig.baseURL = props.tamboUrl;
    if (props.environment) tamboConfig.environment = props.environment as any;

    const client = new TamboAI(tamboConfig);
    const queryClient = new QueryClient();

    const { isFetching: isUpdatingToken } = useTamboSessionToken(
      client,
      queryClient,
      props.userToken,
    );

    const ctx: TamboClientContextProps = {
      client,
      queryClient,
      isUpdatingToken,
    } as any;

    provide(TAMBO_CLIENT_CTX, ctx);
    return () => slots.default ? slots.default() : h("div");
  },
});

export function useTamboClient() {
  const ctx = inject(TAMBO_CLIENT_CTX);
  if (!ctx) throw new Error("useTamboClient must be used within a TamboClientProvider");
  return ctx.client;
}

export function useTamboQueryClient() {
  const ctx = inject(TAMBO_CLIENT_CTX);
  if (!ctx) throw new Error("useTamboQueryClient must be used within a TamboClientProvider");
  return ctx.queryClient;
}

export function useIsTamboTokenUpdating() {
  const ctx = inject(TAMBO_CLIENT_CTX);
  if (!ctx) throw new Error("useIsTamboTokenUpdating must be used within a TamboClientProvider");
  return ctx.isUpdatingToken;
}

