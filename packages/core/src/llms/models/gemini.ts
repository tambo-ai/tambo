import { type GoogleGenerativeAIProvider } from "@ai-sdk/google";
import type {
  LlmModelConfig,
  LlmParameterMetadata,
} from "../../llm-config-types";
import { type NarrowStrings } from "../../typeutils";

type RawModelIds = Parameters<GoogleGenerativeAIProvider["languageModel"]>[0];
type GeminiModelId = NarrowStrings<RawModelIds>;
const reasoningParameters: LlmParameterMetadata = {
  thinkingConfig: {
    description:
      "Set the thinkingBudget and includeThoughts in a JSON object, thinkingBudget is the number of tokens you want to spend on thinking and includeThoughts is a boolean to include thoughts in the response.",
    uiType: "object",
    example: { thinkingBudget: 8192, includeThoughts: true },
  },
};

// Models are sorted by version (newest first). Minor versions (e.g., 2.5) are
// considered newer than their base versions (e.g., 2.0), so 2.5 comes before 2.0.
export const geminiModels: Partial<LlmModelConfig<GeminiModelId>> = {
  "gemini-3-pro-preview": {
    apiName: "gemini-3-pro-preview",
    displayName: "Gemini 3 Pro Preview",
    status: "tested",
    notes:
      "Google's most powerful model as of November 2025, best for multimodal understanding and agentic use cases",
    docLink:
      "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-0-pro",
    tamboDocLink: "https://docs.tambo.co/models/google#gemini-3-pro-preview",
    inputTokenLimit: 1048576,
    modelSpecificParams: reasoningParameters,
  },
  "gemini-2.5-pro": {
    apiName: "gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    status: "known-issues",
    notes:
      "Gemini 2.5 Pro is Google's most advanced reasoning model, capable of solving complex problems.",
    docLink:
      "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-pro",
    tamboDocLink: "https://docs.tambo.co/models/google#gemini-2-5-pro",
    inputTokenLimit: 1048576,
    modelSpecificParams: reasoningParameters,
  },
  "gemini-2.5-flash": {
    apiName: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    status: "known-issues",
    notes:
      "Gemini 2.5 Flash is Google's best model in terms of price and performance, and offers well-rounded capabilities.",
    docLink:
      "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash",
    tamboDocLink: "https://docs.tambo.co/models/google#gemini-2-5-flash",
    inputTokenLimit: 1048576,
    modelSpecificParams: reasoningParameters,
  },
  "gemini-2.0-flash": {
    apiName: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    status: "known-issues",
    notes:
      "Gemini 2.0 Flash delivers next-generation features and improved capabilities designed for the agentic era, including superior speed, built-in tool use, multimodal generation, and a 1M token context window.",
    docLink:
      "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-0-flash",
    tamboDocLink: "https://docs.tambo.co/models/google#gemini-2-0-flash",
    inputTokenLimit: 1048576,
  },
  "gemini-2.0-flash-lite": {
    apiName: "gemini-2.0-flash-lite",
    displayName: "Gemini 2.0 Flash Lite",
    status: "known-issues",
    notes:
      "Gemini 2.0 Flash Lite is a model optimized for cost efficiency and low latency.",
    docLink:
      "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-0-flash-lite",
    tamboDocLink: "https://docs.tambo.co/models/google#gemini-2-0-flash-lite",
    inputTokenLimit: 1048576,
  },
};
