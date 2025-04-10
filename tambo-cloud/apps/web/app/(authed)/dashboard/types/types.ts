// Project Types
export interface ProjectResponseDto {
  id: string;
  name: string;
  userId: string;
}

export interface ProjectDto {
  name: string;
  userId: string;
}

export interface Project {
  id: string;
  name: string;
  userId: string;
  apiKeys: APIKeyResponseDto[];
  providerKeys: ProviderKeyResponseDto[];
}

// API Key Types
export interface APIKeyResponseDto {
  id: string;
  name: string;
  partiallyHiddenKey: string;
  lastUsed: string;
  created: string;
  createdByUserId: string;
}

export interface ProviderKeyResponseDto {
  id: string;
  providerName: string;
  providerKeyEncrypted: string;
  partiallyHiddenKey: string;
}

export interface CreateProjectRequest {
  name: string;
}

export interface CreateApiKeyRequest {
  name: string;
}
