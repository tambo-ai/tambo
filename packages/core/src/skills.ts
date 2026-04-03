/** Providers that support the skills API. */
export const SKILLS_SUPPORTED_PROVIDERS = new Set(["openai", "anthropic"]);

/** Kebab-case pattern for skill names (e.g. "scheduling-assistant"). */
export const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Convert a human-readable string into a valid kebab-case skill name.
 * Lowercases, replaces non-alphanumeric runs with a single hyphen,
 * and trims leading/trailing hyphens.
 * @returns A kebab-case slug suitable for use as a skill name, or an empty
 *   string if the input contains no alphanumeric characters.
 */
export function toSkillSlug(input: string): string {
  const slugged = input.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  // Trim hyphens without regex to avoid CodeQL polynomial-backtracking warnings.
  let start = 0;
  while (start < slugged.length && slugged[start] === "-") start++;
  let end = slugged.length;
  while (end > start && slugged[end - 1] === "-") end--;
  return slugged.slice(start, end);
}

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
