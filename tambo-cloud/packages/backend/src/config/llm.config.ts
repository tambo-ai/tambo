import type { LlmProviderConfig } from "./llm-config-types";
import { anthropicModels } from "./models/anthropic";
import { mistralModels } from "./models/mistral";
import { openaiModels } from "./models/openai";

export const llmProviderConfig: LlmProviderConfig = {
  openai: {
    apiName: "openai",
    displayName: "OpenAI",
    docLinkRoot: "https://platform.openai.com/docs",
    apiKeyLink: "https://platform.openai.com/api-keys",
    models: openaiModels,
    isDefaultProvider: true,
  },
  anthropic: {
    apiName: "anthropic",
    displayName: "Anthropic",
    docLinkRoot: "https://docs.anthropic.com",
    apiKeyLink: "https://console.anthropic.com/settings/keys",
    models: anthropicModels,
  },
  mistral: {
    apiName: "mistral",
    displayName: "Mistral",
    docLinkRoot: "https://docs.mistral.ai/",
    apiKeyLink: "https://console.mistral.ai/api-keys",
    models: mistralModels,
  },
  "openai-compatible": {
    apiName: "openai-compatible",
    displayName: "OpenAI Compatible",
    docLinkRoot: "https://docs.tokenjs.ai/providers/openai-compatible",
    isCustomProvider: true,
    requiresBaseUrl: true,
  },
};
// Not using Groq for now because it is still giving some issues.
