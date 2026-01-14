import {
  AgentProviderType,
  AiProviderType,
  ChatCompletionContentPart,
  ContentPartType,
  GenerationStage,
  MessageRole,
  OAuthValidationMode,
  V1RunStatus,
  ThreadAssistantMessage,
  ThreadMessage,
  ThreadSystemMessage,
  ThreadToolMessage,
  ThreadUserMessage,
} from "@tambo-ai-cloud/core";
import { schema } from "@tambo-ai-cloud/db";

const defaultOpenAITextContent: ChatCompletionContentPart[] = [
  { type: "text", text: "hi" },
];

export type ProjectWithMembers = schema.DBProject & {
  members: schema.DBProjectMember[];
};

export function createMockDBProject(
  id: string,
  overrides: Partial<ProjectWithMembers> = {},
): ProjectWithMembers {
  const now = new Date();
  const project: ProjectWithMembers = {
    id,
    name: overrides.name ?? "My Project",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deprecated_legacyId: overrides.deprecated_legacyId ?? null,
    deprecated_mcpEnabled: overrides.deprecated_mcpEnabled ?? false,
    deprecatedComposioEnabled: overrides.deprecatedComposioEnabled ?? false,
    customInstructions: overrides.customInstructions ?? null,
    allowSystemPromptOverride: overrides.allowSystemPromptOverride ?? false,
    defaultLlmProviderName: overrides.defaultLlmProviderName ?? "openai",
    defaultLlmModelName: overrides.defaultLlmModelName ?? "gpt-4.1-2025-04-14",
    customLlmModelName: overrides.customLlmModelName ?? null,
    customLlmBaseURL: overrides.customLlmBaseURL ?? null,
    maxInputTokens: overrides.maxInputTokens ?? null,
    maxToolCallLimit: overrides.maxToolCallLimit ?? 10,
    oauthValidationMode:
      overrides.oauthValidationMode ?? OAuthValidationMode.ASYMMETRIC_AUTO,
    oauthSecretKeyEncrypted: overrides.oauthSecretKeyEncrypted ?? null,
    oauthPublicKey: overrides.oauthPublicKey ?? null,
    bearerTokenSecret: overrides.bearerTokenSecret ?? "secret",
    isTokenRequired: overrides.isTokenRequired ?? false,
    providerType: overrides.providerType ?? AiProviderType.LLM,
    agentProviderType: overrides.agentProviderType ?? AgentProviderType.AGUI,
    agentUrl: overrides.agentUrl ?? null,
    agentName: overrides.agentName ?? null,
    customLlmParameters: overrides.customLlmParameters ?? null,
    creatorId: overrides.creatorId ?? null,
    members: overrides.members ?? [],
    agentHeaders: overrides.agentHeaders ?? null,
  };

  return project;
}

export function createMockDBThread(
  id: string,
  projectId: string,
  generationStage: GenerationStage = GenerationStage.COMPLETE,
  overrides: Partial<schema.DBThread> = {},
): schema.DBThread {
  const now = new Date();
  const thread: schema.DBThread = {
    id,
    name: overrides.name ?? null,
    projectId,
    contextKey: overrides.contextKey ?? null,
    metadata: overrides.metadata ?? null,
    generationStage: overrides.generationStage ?? generationStage,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    // v1 API run lifecycle fields
    runStatus: overrides.runStatus ?? V1RunStatus.IDLE,
    currentRunId: overrides.currentRunId ?? null,
    statusMessage: overrides.statusMessage ?? null,
    lastRunCancelled: overrides.lastRunCancelled ?? null,
    lastRunError: overrides.lastRunError ?? null,
    pendingToolCallIds: overrides.pendingToolCallIds ?? null,
    lastCompletedRunId: overrides.lastCompletedRunId ?? null,
  };

  return thread;
}

export function createMockDBMessage(
  id: string,
  threadId: string,
  role: MessageRole = MessageRole.User,
  content: ChatCompletionContentPart[] = defaultOpenAITextContent,
  overrides: Partial<schema.DBMessage> = {},
): schema.DBMessage {
  const now = new Date();
  const message: schema.DBMessage = {
    id,
    threadId,
    parentMessageId: overrides.parentMessageId ?? null,
    role,
    content,
    additionalContext: overrides.additionalContext ?? {},
    toolCallId: overrides.toolCallId ?? null,
    componentDecision: overrides.componentDecision ?? null,
    componentState: overrides.componentState ?? {},
    toolCallRequest: overrides.toolCallRequest ?? null,
    actionType: overrides.actionType ?? null,
    error: overrides.error ?? null,
    metadata: overrides.metadata ?? null,
    isCancelled: overrides.isCancelled ?? false,
    createdAt: overrides.createdAt ?? now,
    reasoning: overrides.reasoning ?? null,
    reasoningDurationMS: overrides.reasoningDurationMS ?? null,
  };

  return message;
}

export function createMockThreadMessage(
  id: string,
  threadId: string,
  role: MessageRole = MessageRole.User,
  content: ChatCompletionContentPart[] = [
    { type: ContentPartType.Text, text: "hi" },
  ],
  overrides: Partial<ThreadMessage> = {},
): ThreadMessage {
  const now = new Date();
  const base = {
    id,
    threadId,
    content,
    componentState: overrides.componentState ?? {},
    additionalContext: overrides.additionalContext ?? {},
    actionType: overrides.actionType,
    error: overrides.error,
    metadata: overrides.metadata,
    isCancelled: overrides.isCancelled ?? false,
    createdAt: overrides.createdAt ?? now,
    parentMessageId: overrides.parentMessageId,
    component: overrides.component,
  };

  switch (role) {
    case MessageRole.User: {
      const msg: ThreadUserMessage = {
        ...base,
        role: MessageRole.User,
      };
      return msg;
    }

    case MessageRole.System: {
      const msg: ThreadSystemMessage = {
        ...base,
        role: MessageRole.System,
      };
      return msg;
    }

    case MessageRole.Assistant: {
      const msg: ThreadAssistantMessage = {
        ...base,
        role: MessageRole.Assistant,
        tool_call_id: overrides.tool_call_id,
        toolCallRequest: overrides.toolCallRequest,
        reasoning: overrides.reasoning,
        reasoningDurationMS: overrides.reasoningDurationMS,
      };
      return msg;
    }

    case MessageRole.Tool: {
      const msg: ThreadToolMessage = {
        ...base,
        role: MessageRole.Tool,
        tool_call_id: overrides.tool_call_id ?? "default-tool-call-id",
      };
      return msg;
    }

    default:
      throw new Error(`Unknown message role: ${role}`);
  }
}
