/**
 * Provider-specific metadata returned after uploading a skill
 * to an external provider API (e.g., OpenAI, Anthropic).
 */
export interface ProviderSkillReference {
  skillId: string;
  uploadedAt: string;
  version: string;
}

/**
 * Stores provider-specific skill metadata keyed by provider name.
 * Each key (e.g., "openai", "anthropic") maps to the metadata
 * returned by that provider's skill upload API.
 */
export type ExternalSkillMetadata = Partial<
  Record<string, ProviderSkillReference>
>;
