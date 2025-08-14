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
  isTokenRequired!: boolean;
}

export class SimpleProjectResponse {
  id!: string;
  name!: string;
}
