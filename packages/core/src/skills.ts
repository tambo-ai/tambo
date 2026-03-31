/** Kebab-case pattern for skill names (e.g. "scheduling-assistant"). */
export const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validation limits for skill fields. Shared across tRPC and any future entry points. */
export const SKILL_NAME_MAX_LENGTH = 200;
export const SKILL_DESCRIPTION_MAX_LENGTH = 2000;
export const SKILL_INSTRUCTIONS_MAX_LENGTH = 100_000;

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

/**
 * Skills to pass to the LLM via provider-specific mechanisms at runtime.
 * Built from enabled skills with uploaded provider metadata.
 */
export interface ProviderSkillConfig {
  providerName: string;
  skills: Array<{
    skillId: string;
    version: string;
  }>;
}
