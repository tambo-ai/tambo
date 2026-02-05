// When changing this, always use the apiName from the model config in packages/core/src/llms/models/
export const DEFAULT_OPENAI_MODEL = "gpt-5.2";
// Model and provider used for suggestion generation
export const SUGGESTION_MODEL = "gpt-5-nano-2025-08-07";
export const SUGGESTION_PROVIDER = "openai";

/**
 * URI scheme prefix for attachment references.
 * Format: attachment://{projectId}/{uniqueId}
 */
export const ATTACHMENT_PREFIX = "attachment://";
