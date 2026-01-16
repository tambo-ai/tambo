// When changing this, always use the apiName from the model config in packages/backend/src/config/models
export const DEFAULT_OPENAI_MODEL = "gpt-4.1-2025-04-14";
// Model and provider used for suggestion generation
export const SUGGESTION_MODEL = "gpt-4.1-mini-2025-04-14";
export const SUGGESTION_PROVIDER = "openai";

/**
 * URI scheme prefix for attachment references.
 * Format: attachment://{projectId}/{uniqueId}
 */
export const ATTACHMENT_PREFIX = "attachment://";
