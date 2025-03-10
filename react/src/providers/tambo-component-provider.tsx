"use client";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState
} from "react";
import { TamboTool } from "../model/component-metadata";
import {
  GenerationStage,
  isIdleStage
} from "../model/generate-component-response";
import { useTamboClient } from "./tambo-client-provider";
import {
  RegisterComponentOptions,
  useTamboRegistry,
} from "./tambo-registry-provider";
import { useTamboThread } from "./tambo-thread-provider";

export interface TamboComponentContextProps {
  registerComponent: (options: RegisterComponentOptions) => void;
  generationStage: GenerationStage;
  isIdle: boolean;
  registerTool: (tool: TamboTool) => void;
  registerTools: (tools: TamboTool[]) => void;
  addToolAssociation: (componentName: string, tool: TamboTool) => void;
}

const TamboComponentContext = createContext<TamboComponentContextProps>({
  generationStage: GenerationStage.IDLE,
  isIdle: true,
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
    addThreadMessage,
    updateThreadMessage,
    switchCurrentThread,
    thread: currentThread,
  } = useTamboThread();
  const {
    componentList,
    registerComponent,
    addToolAssociation,
    registerTool,
    componentToolAssociations,
    registerTools,
    toolRegistry,
  } = useTamboRegistry();
  const [generationStage, setGenerationStage] = useState<GenerationStage>(
    GenerationStage.IDLE,
  );

  const isIdle = isIdleStage(generationStage);



  const value = {
    client,
    registerComponent,
    generationStage,
    isIdle,
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
