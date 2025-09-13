import { InjectionKey, inject, provide } from "vue";
import { TamboClientContextProps, TamboClientKey, provideTamboClient } from "./tambo-client-provider";
import { TamboThreadContextProps } from "./tambo-thread-provider";
import { TamboContextHelpersContextProps } from "./tambo-context-helpers-provider";
import { TamboComponentContextProps } from "./tambo-component-provider";
import { TamboInteractableContext } from "../model/tambo-interactable";
import { TamboThreadKey, TamboGenerationStageKey } from "./tambo-thread-provider";
import { TamboRegistryKey, TamboRegistryContext } from "./tambo-registry-provider";
import { TamboContextHelpersKey } from "./tambo-context-helpers-provider";

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
  // Compose from individual contexts to ensure consistent shape
  const client = inject(TamboClientKey) as any;
  const registry = inject(TamboRegistryKey) as TamboRegistryContext | undefined;
  const helpers = inject(TamboContextHelpersKey) as TamboContextHelpersContextProps | undefined;
  const thread = inject(TamboThreadKey) as TamboThreadContextProps | undefined;
  const stage = inject(TamboGenerationStageKey) as any;

  if (!client) throw new Error("useTambo must be used after plugin installation");

  return {
    ...client,
    ...(registry || {}),
    ...(helpers || {}),
    ...(thread || {}),
    ...(stage || {}),
  } as TamboContextProps as any;
}

