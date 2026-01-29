"use client";
import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/react-query";
import React, { PropsWithChildren, useEffect } from "react";
import {
  TamboComponent,
  TamboTool,
  TamboToolRegistry,
} from "../model/component-metadata";
import { GenerationStage } from "../model/generate-component-response";
import { TamboThread } from "../model/tambo-thread";
import { TamboClientContext } from "./tambo-client-provider";
import {
  TamboComponentContextProps,
  TamboComponentProvider,
} from "./tambo-component-provider";
import { TamboContextAttachmentProvider } from "./tambo-context-attachment-provider";
import {
  TamboContextHelpersProvider,
  TamboContextHelpersProviderProps,
} from "./tambo-context-helpers-provider";
import { TamboInteractableProvider } from "./tambo-interactable-provider";
import {
  TamboCompositeProvider,
  type TamboContextProps,
} from "./tambo-provider";
import { TamboRegistryContext } from "./tambo-registry-provider";
import {
  TamboGenerationStageProvider,
  TamboThreadContext,
  TamboThreadContextProps,
} from "./tambo-thread-provider";

/**
 * TamboStubProvider props - includes all the data that would normally be inferred
 */
export interface TamboStubProviderProps extends Partial<TamboContextProps> {
  /** Required: The thread data to display */
  thread: TamboThread;
  /** Optional: Components registry - defaults to empty */
  components?: TamboComponent[];
  /** Optional: Tools registry - defaults to empty */
  tools?: TamboTool[];
  /** Optional: Threads data to populate thread list - overrides useTamboThreadList() */
  threads?: Partial<TamboAI.Beta.Threads.ThreadsOffsetAndLimit>;
  /** Optional: Project ID to use for query cache - defaults to thread.projectId */
  projectId?: string;
  /** Optional: Context key for thread list queries */
  contextKey?: string;
  /** Optional: Configuration for which context helpers are enabled/disabled */
  contextHelpers?: TamboContextHelpersProviderProps["contextHelpers"];
}

/**
 * Stub client provider that accepts a client and queryClient as props
 * @returns The TamboStubClientProvider component
 */
const TamboStubClientProvider: React.FC<
  PropsWithChildren<{
    client: TamboAI;
    queryClient: QueryClient;
    isUpdatingToken: boolean;
    threads?: Partial<TamboAI.Beta.Threads.ThreadsOffsetAndLimit>;
    projectId?: string;
    contextKey?: string;
  }>
> = ({
  children,
  client,
  queryClient,
  threads,
  projectId,
  contextKey,
  isUpdatingToken,
}) => {
  // Prepopulate the query cache with threads data if provided
  useEffect(() => {
    if (threads) {
      // Set the project ID in the cache
      queryClient.setQueryData(["projectId"], projectId);

      // Set the threads data in the cache using the same query key pattern as useTamboThreadList
      queryClient.setQueryData(["threads", projectId, contextKey], threads);
    }
  }, [threads, projectId, contextKey, queryClient]);

  return (
    <TamboClientContext.Provider
      value={{
        client,
        queryClient,
        isUpdatingToken,
      }}
    >
      {children}
    </TamboClientContext.Provider>
  );
};

/**
 * Stub registry provider that accepts componentList, toolRegistry, and componentToolAssociations as props
 * @returns The TamboStubRegistryProvider component
 */
const TamboStubRegistryProvider: React.FC<
  PropsWithChildren<
    Pick<
      TamboRegistryContext,
      | "componentList"
      | "toolRegistry"
      | "componentToolAssociations"
      | "registerComponent"
      | "registerTool"
      | "registerTools"
      | "addToolAssociation"
    >
  >
> = ({
  children,
  componentList,
  toolRegistry,
  componentToolAssociations,
  registerComponent,
  registerTool,
  registerTools,
  addToolAssociation,
}) => {
  return (
    <TamboRegistryContext.Provider
      value={{
        componentList,
        toolRegistry,
        componentToolAssociations,
        mcpServerInfos: [],
        resources: [],
        resourceSource: null,
        registerComponent,
        registerTool,
        registerTools,
        addToolAssociation,
        registerMcpServer: () => {},
        registerMcpServers: () => {},
        registerResource: () => {},
        registerResources: () => {},
        registerResourceSource: () => {},
      }}
    >
      {children}
    </TamboRegistryContext.Provider>
  );
};

/**
 * Stub thread provider that accepts all thread context props
 * @returns The TamboStubThreadProvider component
 */
const TamboStubThreadProvider: React.FC<
  PropsWithChildren<TamboThreadContextProps>
> = ({ children, ...threadContextProps }) => {
  // Extract generation stage info from the thread
  const generationStage =
    (threadContextProps.thread?.generationStage as GenerationStage) ??
    GenerationStage.IDLE;
  const statusMessage = threadContextProps.thread?.statusMessage ?? "";

  return (
    <TamboThreadContext.Provider value={threadContextProps}>
      <TamboGenerationStageProvider
        generationStage={generationStage}
        statusMessage={statusMessage}
      >
        {children}
      </TamboGenerationStageProvider>
    </TamboThreadContext.Provider>
  );
};

/**
 * Default no-op functions that throw errors - used when callbacks are not provided
 * @returns The default callbacks
 */
const createDefaultCallbacks = () => ({
  switchCurrentThread: () => {
    throw new Error("switchCurrentThread not implemented in stub");
  },
  startNewThread: () => {
    throw new Error("startNewThread not implemented in stub");
  },
  updateThreadName: () => {
    throw new Error("updateThreadName not implemented in stub");
  },
  generateThreadName: () => {
    throw new Error("generateThreadName not implemented in stub");
  },
  addThreadMessage: () => {
    throw new Error("addThreadMessage not implemented in stub");
  },
  updateThreadMessage: () => {
    throw new Error("updateThreadMessage not implemented in stub");
  },
  setInputValue: () => {
    throw new Error("setInputValue not implemented in stub");
  },
  sendThreadMessage: () => {
    throw new Error("sendThreadMessage not implemented in stub");
  },
  registerComponent: () => {
    throw new Error("registerComponent not implemented in stub");
  },
  registerTool: () => {
    throw new Error("registerTool not implemented in stub");
  },
  registerTools: () => {
    throw new Error("registerTools not implemented in stub");
  },
  addToolAssociation: () => {
    throw new Error("addToolAssociation not implemented in stub");
  },
  cancel: () => {
    throw new Error("cancel not implemented in stub");
  },
});

/**
 * The TamboStubProvider provides a way to use the Tambo API with static/stub data.
 * This is useful for testing, samples, and static UI development.
 *
 * Unlike TamboProvider, all data must be provided as props rather than being inferred.
 * @example
 * ```tsx
 * import { TamboStubProvider } from '@tambo-ai/react-sdk';
 *
 * const exampleThread = {
 *   id: "example-thread",
 *   messages: [
 *     {
 *       id: "msg-1",
 *       role: "user",
 *       content: [{ type: "text", text: "Hello!" }],
 *       createdAt: new Date().toISOString(),
 *       threadId: "example-thread",
 *       componentState: {},
 *     },
 *     {
 *       id: "msg-2",
 *       role: "assistant",
 *       content: [{ type: "text", text: "Hi there!" }],
 *       createdAt: new Date().toISOString(),
 *       threadId: "example-thread",
 *       componentState: {},
 *     }
 *   ],
 *   createdAt: new Date().toISOString(),
 *   projectId: "example-project",
 *   updatedAt: new Date().toISOString(),
 *   metadata: {},
 * };
 *
 * const exampleThreadList = [exampleThread];
 *
 * function MyComponent() {
 *   return (
 *     <TamboStubProvider
 *       thread={exampleThread}
 *       components={[]}
 *       tools={[]}
 *       threads={exampleThreadList}
 *       projectId="example-project"
 *     >
 *       <MessageThreadFull />
 *     </TamboStubProvider>
 *   );
 * }
 * ```
 * @param props - The props for the TamboStubProvider
 * @param props.children - The children to wrap
 * @param props.thread - The thread data to display
 * @param props.components - Optional components registry
 * @param props.tools - Optional tools registry
 * @param props.threads - Optional threads data to populate thread list (overrides useTamboThreadList)
 * @param props.projectId - Optional project ID for query cache (defaults to thread.projectId)
 * @param props.contextKey - Optional context key for thread list queries
 * @param props.contextHelpers - Optional configuration for which context helpers are enabled/disabled
 * @returns The TamboStubProvider component
 */
export const TamboStubProvider: React.FC<
  PropsWithChildren<TamboStubProviderProps>
> = ({
  children,
  thread,
  components = [],
  tools = [],
  threads,
  projectId,
  contextKey,
  contextHelpers,
  ...overrides
}) => {
  const defaults = createDefaultCallbacks();

  // Create stub client and queryClient
  const stubClient = {} as TamboAI;
  const stubQueryClient = new QueryClient();

  // Use provided projectId or fall back to thread's projectId
  const resolvedProjectId = projectId ?? thread.projectId;

  // Build component registry from components prop
  const componentList = components.reduce(
    (acc, component) => {
      acc[component.name] = {
        component: component.component,
        loadingComponent: component.loadingComponent,
        name: component.name,
        description: component.description,
        props: component.propsDefinition ?? {},
        contextTools: [],
      };
      return acc;
    },
    {} as Record<string, any>,
  );

  // Build tool registry from tools prop
  const toolRegistry = tools.reduce((acc, tool) => {
    acc[tool.name] = tool;
    return acc;
  }, {} as TamboToolRegistry);

  // Build tool associations from components
  const componentToolAssociations = components.reduce(
    (acc, component) => {
      if (component.associatedTools) {
        acc[component.name] = component.associatedTools.map(
          (tool) => tool.name,
        );
      }
      return acc;
    },
    {} as Record<string, string[]>,
  );

  // Merge defaults with provided overrides
  const threadContextProps: TamboThreadContextProps = {
    thread,
    currentThreadId: thread.id,
    currentThread: thread,
    threadMap: { [thread.id]: thread },
    setThreadMap: () => {},
    switchCurrentThread:
      overrides.switchCurrentThread ?? defaults.switchCurrentThread,
    startNewThread: overrides.startNewThread ?? defaults.startNewThread,
    updateThreadName: overrides.updateThreadName ?? defaults.updateThreadName,
    generateThreadName:
      overrides.generateThreadName ?? defaults.generateThreadName,
    addThreadMessage: overrides.addThreadMessage ?? defaults.addThreadMessage,
    updateThreadMessage:
      overrides.updateThreadMessage ?? defaults.updateThreadMessage,
    streaming: overrides.streaming ?? true,
    sendThreadMessage:
      overrides.sendThreadMessage ?? defaults.sendThreadMessage,
    cancel: overrides.cancel ?? defaults.cancel,
    contextKey,
  };

  const componentContextProps: TamboComponentContextProps = {
    registerComponent:
      overrides.registerComponent ?? defaults.registerComponent,
    registerTool: overrides.registerTool ?? defaults.registerTool,
    registerTools: overrides.registerTools ?? defaults.registerTools,
    addToolAssociation:
      overrides.addToolAssociation ?? defaults.addToolAssociation,
  };

  return (
    <TamboStubClientProvider
      client={stubClient}
      queryClient={stubQueryClient}
      threads={threads}
      projectId={resolvedProjectId}
      contextKey={contextKey}
      isUpdatingToken={false}
    >
      <TamboStubRegistryProvider
        componentList={componentList}
        toolRegistry={toolRegistry}
        componentToolAssociations={componentToolAssociations}
        registerComponent={componentContextProps.registerComponent}
        registerTool={componentContextProps.registerTool}
        registerTools={componentContextProps.registerTools}
        addToolAssociation={componentContextProps.addToolAssociation}
      >
        <TamboStubThreadProvider {...threadContextProps}>
          <TamboContextHelpersProvider contextHelpers={contextHelpers}>
            <TamboContextAttachmentProvider>
              <TamboComponentProvider>
                <TamboInteractableProvider>
                  <TamboCompositeProvider>{children}</TamboCompositeProvider>
                </TamboInteractableProvider>
              </TamboComponentProvider>
            </TamboContextAttachmentProvider>
          </TamboContextHelpersProvider>
        </TamboStubThreadProvider>
      </TamboStubRegistryProvider>
    </TamboStubClientProvider>
  );
};
