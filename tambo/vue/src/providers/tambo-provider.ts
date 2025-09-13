import { InjectionKey, inject, provide } from "vue";
import { TamboClientContextProps, provideTamboClient } from "./tambo-client-provider";

export type TamboContextProps = TamboClientContextProps;

const TamboKey: InjectionKey<TamboContextProps> = Symbol("TamboContext");

export interface TamboProviderProps {
  tamboUrl?: string;
  apiKey: string;
  environment?: "production" | "staging";
  userToken?: string;
}

export function provideTambo(props: TamboProviderProps) {
  const clientCtx = provideTamboClient(props);
  const ctx: TamboContextProps = {
    ...clientCtx,
  };
  provide(TamboKey, ctx);
  return ctx;
}

export function useTambo() {
  const ctx = inject(TamboKey);
  if (!ctx) throw new Error("useTambo must be used after provideTambo");
  return ctx;
}

