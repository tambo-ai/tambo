"use client";
import TamboAI from "@tambo-ai/typescript-sdk";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";
import { TamboTool } from "../model/component-metadata";
import {
  GenerationStage,
  isIdleStage,
  TamboThreadMessage,
} from "../model/generate-component-response";
import { generateAndHydrate } from "../util/generate-component";
import { useTamboClient } from "./tambo-client-provider";
import {
  RegisterComponentOptions,
  useTamboRegistry,
} from "./tambo-registry-provider";
import { PLACEHOLDER_THREAD, useTamboThread } from "./tambo-thread-provider";

export interface TamboComponentContextProps {
  registerComponent: (options: RegisterComponentOptions) => void;
  generateComponent: (
    params: TamboAI.Beta.Components.ComponentGenerateParams & {
      stream?: boolean;
    },
    options?: TamboAI.RequestOptions,
  ) => Promise<TamboThreadMessage>;
  generationStage: GenerationStage;
  isIdle: boolean;
  registerTool: (tool: TamboTool) => void;
  registerTools: (tools: TamboTool[]) => void;
  addToolAssociation: (componentName: string, tool: TamboTool) => void;
}

const TamboComponentContext = createContext<TamboComponentContextProps>({
  generateComponent: () => Promise.resolve({} as TamboThreadMessage),
  generationStage: GenerationStage.IDLE,
  isIdle: true,
  registerComponent: () => {},
  registerTool: () => {},
  registerTools: () => {},
  addToolAssociation: () => {},
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

  const generateComponent = useCallback(
    async (
      params: TamboAI.Beta.Components.ComponentGenerateParams & {
        stream?: boolean;
      },
      options?: TamboAI.RequestOptions,
    ): Promise<TamboThreadMessage> => {
      if (!isIdleStage(generationStage)) {
        throw new Error(`Generation already in progress: ${generationStage}`);
      }

      if (params.threadId && params.threadId !== currentThread.id) {
        switchCurrentThread(params.threadId);
      }
      const componentMessage = await generateAndHydrate(
        client,
        componentList,
        toolRegistry,
        componentToolAssociations,
        currentThread.id === PLACEHOLDER_THREAD.id
          ? undefined
          : currentThread.id,
        params.content,
        params,
        (state) => setGenerationStage(state),
        params.stream,
        options,
      );

      if (params.stream) {
        let finalResponse: TamboThreadMessage | undefined;
        const generationResponse =
          componentMessage as AsyncIterable<TamboThreadMessage>;
        for await (const chunk of generationResponse) {
          if (chunk.threadId && chunk.threadId !== currentThread?.id) {
            switchCurrentThread(chunk.threadId);
          }
          if (!finalResponse) {
            finalResponse = chunk;
            addThreadMessage(finalResponse, false);
          } else {
            // use previous chunk's id for update, in case new chunk has a different id (from tambotion response)
            updateThreadMessage(finalResponse.id, chunk, false);
            finalResponse = chunk;
          }
        }
        if (!finalResponse) {
          throw new Error("No response from generation");
        }
        return finalResponse;
      }
      const generationResponse = componentMessage as TamboThreadMessage;
      if (
        generationResponse.threadId &&
        generationResponse.threadId !== currentThread?.id
      ) {
        switchCurrentThread(generationResponse.threadId);
      }

      if (generationResponse) {
        // we do not need to send this to the server, as it is already in the thread
        addThreadMessage(generationResponse, false);
      }

      return generationResponse;
    },
    [
      generationStage,
      switchCurrentThread,
      currentThread,
      client,
      componentList,
      addThreadMessage,
      updateThreadMessage,
      componentToolAssociations,
      toolRegistry,
    ],
  );

  const value = {
    client,
    generateComponent,
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
