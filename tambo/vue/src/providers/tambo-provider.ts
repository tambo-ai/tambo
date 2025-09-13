import { InjectionKey, inject, provide } from "vue";
import { TamboClientContextProps, provideTamboClient } from "./tambo-client-provider";
import { TamboThreadContextProps } from "./tambo-thread-provider";
import { TamboContextHelpersContextProps } from "./tambo-context-helpers-provider";
import { TamboComponentContextProps } from "./tambo-component-provider";
import { TamboInteractableContext } from "../model/tambo-interactable";

export type TamboContextProps = TamboClientContextProps &
  TamboThreadContextProps &
  TamboContextHelpersContextProps &
  TamboComponentContextProps &
  TamboInteractableContext;

export const TamboKey: InjectionKey<TamboContextProps> = Symbol("TamboContext");

export interface TamboProviderProps {
  tamboUrl?: string;
  apiKey: string;
  environment?: "production" | "staging";
  userToken?: string;
}

export function provideTambo(props: TamboProviderProps) {
  const clientCtx = provideTamboClient(props);
  const ctx: TamboContextProps = {
    ...(clientCtx as any),
    // The full context is assembled by the plugin; this provider keeps client piece only.
  } as any;
  provide(TamboKey, ctx);
  return ctx;
}

export function useTambo() {
  const ctx = inject(TamboKey);
  if (!ctx) throw new Error("useTambo must be used after provideTambo");
  return ctx;
}

