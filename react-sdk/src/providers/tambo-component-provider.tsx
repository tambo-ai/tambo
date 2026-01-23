"use client";
import React, { createContext, PropsWithChildren, useContext } from "react";
import {
  RegisterToolFn,
  RegisterToolsFn,
  TamboComponent,
  TamboTool,
} from "../model/component-metadata";
import { useTamboClient } from "./tambo-client-provider";
import { useTamboRegistry } from "./tambo-registry-provider";

export interface TamboComponentContextProps {
  registerComponent: (options: TamboComponent) => void;
  registerTool: RegisterToolFn;
  registerTools: RegisterToolsFn;
  addToolAssociation: (componentName: string, tool: TamboTool) => void;
}

const TamboComponentContext = createContext<TamboComponentContextProps>({
  /**
   *
   */
  registerComponent: () => {},
  /**
   *
   */
  registerTool: () => {},
  /**
   *
   */
  registerTools: () => {},
  /**
   *
   */
  addToolAssociation: () => {},
});

/**
 * The TamboComponentProvider is a React provider that provides component
 * registration services to the descendants of the provider.
 * @param props - The props for the TamboComponentProvider
 * @param props.children - The children to wrap
 * @returns The TamboComponentProvider component
 */
export const TamboComponentProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const client = useTamboClient();
  const { registerComponent, addToolAssociation, registerTool, registerTools } =
    useTamboRegistry();

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

/**
 * The useTamboComponent hook provides access to the component registration
 * services to the descendants of the TamboComponentProvider.
 * @returns The component registration services
 */
export const useTamboComponent = () => {
  return useContext(TamboComponentContext);
};
