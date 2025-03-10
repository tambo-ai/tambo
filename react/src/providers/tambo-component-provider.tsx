"use client";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
} from "react";
import { TamboTool } from "../model/component-metadata";
import { useTamboClient } from "./tambo-client-provider";
import {
  RegisterComponentOptions,
  useTamboRegistry,
} from "./tambo-registry-provider";

export interface TamboComponentContextProps {
  registerComponent: (options: RegisterComponentOptions) => void;
  registerTool: (tool: TamboTool) => void;
  registerTools: (tools: TamboTool[]) => void;
  addToolAssociation: (componentName: string, tool: TamboTool) => void;
}

const TamboComponentContext = createContext<TamboComponentContextProps>({
  registerComponent: () => { },
  registerTool: () => { },
  registerTools: () => { },
  addToolAssociation: () => { },
});

export const TamboComponentProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const client = useTamboClient();
  const {
    registerComponent,
    addToolAssociation,
    registerTool,
    registerTools,
  } = useTamboRegistry();

  const value = {
    client,
    registerComponent,
    registerTool,
    registerTools,
    addToolAssociation,
  };

  return (
    <TamboComponentContext.Provider value={value}>
      {children}
    </TamboComponentContext.Provider>
  );
};

export const useTamboComponent = () => {
  return useContext(TamboComponentContext);
};
