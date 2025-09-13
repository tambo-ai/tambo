import { InjectionKey, inject, provide } from "vue";
import { TamboComponent, TamboTool } from "../model/component-metadata";
import { useTamboClient } from "./tambo-client-provider";
import { useTamboRegistry } from "./tambo-registry-provider";

export interface TamboComponentContextProps {
  registerComponent: (options: TamboComponent) => void;
  registerTool: (tool: TamboTool) => void;
  registerTools: (tools: TamboTool[]) => void;
  addToolAssociation: (componentName: string, tool: TamboTool) => void;
}

const TamboComponentKey: InjectionKey<TamboComponentContextProps> = Symbol("TamboComponentContext");

export function provideTamboComponent() {
  const client = useTamboClient();
  void client; // keep parity with React provider value
  const { registerComponent, addToolAssociation, registerTool, registerTools } = useTamboRegistry();
  const value: TamboComponentContextProps = {
    registerComponent,
    registerTool,
    registerTools,
    addToolAssociation,
  };
  provide(TamboComponentKey, value);
  return value;
}

export function useTamboComponent() {
  const ctx = inject(TamboComponentKey);
  if (!ctx) throw new Error("useTamboComponent must be used after provideTamboComponent");
  return ctx;
}

