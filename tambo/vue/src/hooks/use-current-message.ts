import { InjectionKey, VNode, inject, provide } from "vue";
import { TamboThreadMessage } from "../model/generate-component-response";

export const TamboMessageKey: InjectionKey<TamboThreadMessage> = Symbol("TamboMessage");

export function provideTamboMessage(message: TamboThreadMessage) {
  provide(TamboMessageKey, message);
}

export function wrapWithTamboMessageProvider(
  vnode: VNode,
  message: TamboThreadMessage,
) {
  // In Vue, provider is typically used in setup() of a wrapper component.
  // Consumers can call provideTamboMessage in their component setup before rendering vnode.
  return vnode;
}

export function useTamboCurrentMessage() {
  const message = inject(TamboMessageKey, null);
  if (!message) {
    throw new Error("useTamboCurrentMessage must be used within a provider");
  }
  return message;
}

