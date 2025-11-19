import {
  AgentProviderType,
  AiProviderType,
  CustomLlmParameters,
} from "@tambo-ai-cloud/core";

export class ProjectCreateRequest {
  projectName!: string;
}

export class ProjectUpdateRequest {
  name!: string;
}

export class ProjectResponse {
  id!: string;
  name!: string;
  userId!: string;
  defaultLlmProviderName?: string;
  defaultLlmModelName?: string;
  customLlmModelName?: string;
  customLlmBaseURL?: string;
  customInstructions?: string;
  maxInputTokens?: number | null;
  allowSystemPromptOverride?: boolean;
  isTokenRequired!: boolean;
  providerType!: AiProviderType;
  agentProviderType?: AgentProviderType;
  // TODO: This should not be exposed in the public API
  agentName?: string;
  // TODO: This should not be exposed in the public API
  agentUrl?: string;
  customLlmParameters?: CustomLlmParameters;
}

export class SimpleProjectResponse {
  id!: string;
  name!: string;
}
