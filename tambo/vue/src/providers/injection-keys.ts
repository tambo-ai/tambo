import type TamboAI from "@tambo-ai/typescript-sdk";
import type { QueryClient } from "@tanstack/vue-query";
import type { ComponentRegistry, TamboTool } from "../model/component-metadata";
import type { TamboThread } from "../model/tambo-thread";
import type { ContextHelpers } from "../context-helpers/types";
import type { GenerationStage } from "../model/generate-component-response";

export interface TamboClientContextProps {
  client: TamboAI;
  queryClient: QueryClient;
  isUpdatingToken: boolean;
}

export const TAMBO_CLIENT_CTX = Symbol("TAMBO_CLIENT_CTX") as InjectionKey<TamboClientContextProps>;

export interface TamboComponentContextProps {
  registerComponent: (options: any) => void;
  registerTool: (tool: TamboTool) => void;
  registerTools: (tools: TamboTool[]) => void;
  addToolAssociation: (componentName: string, tool: TamboTool) => void;
}

export const TAMBO_COMPONENT_CTX = Symbol("TAMBO_COMPONENT_CTX") as InjectionKey<TamboComponentContextProps>;

export interface TamboRegistryContext {
  componentList: ComponentRegistry;
  toolRegistry: Record<string, TamboTool>;
  componentToolAssociations: Record<string, string[]>;
  registerComponent: (options: any) => void;
  registerTool: (tool: TamboTool) => void;
  registerTools: (tools: TamboTool[]) => void;
  addToolAssociation: (componentName: string, tool: TamboTool) => void;
  onCallUnregisteredTool?: (toolName: string, args: any[]) => Promise<string>;
}

export const TAMBO_REGISTRY_CTX = Symbol("TAMBO_REGISTRY_CTX") as InjectionKey<TamboRegistryContext>;

export interface TamboContextHelpersContextProps {
  getAdditionalContext: () => Promise<{ name: string; context: any }[]>;
  getContextHelpers: () => ContextHelpers;
  addContextHelper: (name: string, helper: (...args: any[]) => any) => void;
  removeContextHelper: (name: string) => void;
}

export const TAMBO_CONTEXT_HELPERS_CTX = Symbol("TAMBO_CONTEXT_HELPERS_CTX") as InjectionKey<TamboContextHelpersContextProps>;

export interface TamboThreadContextProps {
  thread: TamboThread;
  switchCurrentThread: (threadId: string, fetch?: boolean) => void;
  startNewThread: () => void;
  updateThreadName: (name: string, threadId?: string) => void;
  generateThreadName: (threadId?: string) => Promise<any>;
  addThreadMessage: (message: any, sendToServer: boolean) => Promise<any[]>;
  updateThreadMessage: (id: string, message: any, sendToServer: boolean) => Promise<void>;
  cancel: (threadId?: string) => Promise<void>;
  streaming: boolean;
  sendThreadMessage: (
    message: string,
    options?: {
      threadId?: string;
      streamResponse?: boolean;
      contextKey?: string;
      forceToolChoice?: string;
      additionalContext?: Record<string, any>;
      content?: any[];
    },
  ) => Promise<any>;
}

export const TAMBO_THREAD_CTX = Symbol("TAMBO_THREAD_CTX") as InjectionKey<TamboThreadContextProps>;

export interface TamboGenerationStageContextProps {
  generationStage: GenerationStage;
  generationStatusMessage: string;
  isIdle: boolean;
}

export const TAMBO_GEN_STAGE_CTX = Symbol("TAMBO_GEN_STAGE_CTX") as InjectionKey<TamboGenerationStageContextProps>;

export type InjectionKey<T> = import("vue").InjectionKey<T>;

