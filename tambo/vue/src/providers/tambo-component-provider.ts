import { defineComponent, h, inject, provide } from "vue";
import { useTamboClient } from "./tambo-client-provider";
import { useTamboRegistry } from "./tambo-registry-provider";
import { TAMBO_COMPONENT_CTX, type TamboComponentContextProps } from "./injection-keys";

export const TamboComponentProvider = defineComponent({
  name: "TamboComponentProvider",
  setup(_props, { slots }) {
    const client = useTamboClient();
    const { registerComponent, addToolAssociation, registerTool, registerTools } = useTamboRegistry();
    const value: TamboComponentContextProps = {
      // @ts-expect-error store client for consumers if needed
      client: client as any,
      registerComponent,
      registerTool,
      registerTools,
      addToolAssociation,
    } as any;
    provide(TAMBO_COMPONENT_CTX, value);
    return () => (slots.default ? slots.default() : h("div"));
  },
});

export function useTamboComponent() {
  const ctx = inject(TAMBO_COMPONENT_CTX);
  if (!ctx) throw new Error("useTamboComponent must be used within a TamboComponentProvider");
  return ctx;
}

