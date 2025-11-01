import { defineComponent, h, inject, provide } from "vue";
import type { TamboThreadMessage } from "../model/generate-component-response";

const TAMBO_MESSAGE_CTX = Symbol("TAMBO_MESSAGE_CTX") as import("vue").InjectionKey<TamboThreadMessage>;

export const TamboMessageProvider = defineComponent<{ message: TamboThreadMessage }>({
  name: "TamboMessageProvider",
  props: { message: { type: Object as any, required: true } },
  setup(props, { slots }) {
    provide(TAMBO_MESSAGE_CTX, props.message);
    return () => (slots.default ? slots.default() : h("div"));
  },
});

export function wrapWithTamboMessageProvider(node: any, message: TamboThreadMessage) {
  return h(TamboMessageProvider, { message }, () => [node]);
}

export function useTamboCurrentMessage() {
  const msg = inject(TAMBO_MESSAGE_CTX);
  if (!msg) throw new Error("useTamboCurrentMessage must be used within a TamboMessageProvider");
  return msg;
}

