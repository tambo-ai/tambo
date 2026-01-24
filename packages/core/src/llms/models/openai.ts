import { type OpenAIProvider } from "@ai-sdk/openai";
import type {
  LlmModelConfig,
  LlmParameterMetadata,
} from "../../llm-config-types";
import { type NarrowStrings } from "../../typeutils";

type RawModelIds = Parameters<OpenAIProvider["languageModel"]>[0];
type OpenAIModelId = NarrowStrings<RawModelIds>;
const reasoningParameters: LlmParameterMetadata = {
  reasoningEffort: {
    description:
      "Controls the effort of the model to reason, only if reasoningSummary is also set",
    uiType: "string",
    example: "medium",
  },
  reasoningSummary: {
    description: "Enables reasoning token output",
    uiType: "string",
    example: "auto",
  },
};
// Models are sorted by version (newest first). Minor versions (e.g., 5.1) are
// considered newer than their base versions (e.g., 5), so 5.1 comes before 5.
export const openaiModels: Partial<LlmModelConfig<OpenAIModelId>> = {
  "gpt-5.1": {
    apiName: "gpt-5.1",
    displayName: "gpt-5.1 Thinking",
    status: "tested",
    notes:
      "GPT-5.1 Thinking with adaptive reasoning. Dynamically varies thinking time based on task complexity for better token efficiency",
    docLink: "https://platform.openai.com/docs/guides/latest-model",
    tamboDocLink: "https://docs.tambo.co/models/openai#gpt-51-thinking",
    inputTokenLimit: 400000,
    modelSpecificParams: reasoningParameters,
  },
  "gpt-5.1-chat-latest": {
    apiName: "gpt-5.1-chat-latest",
    displayName: "gpt-5.1 Instant",
    status: "tested",
    notes:
      "GPT-5.1 Instant - warmer, more conversational model with adaptive reasoning. Defaults to 'none' reasoning effort for latency-sensitive workloads",
    docLink: "https://platform.openai.com/docs/guides/latest-model",
    tamboDocLink: "https://docs.tambo.co/models/openai#gpt-51-instant",
    inputTokenLimit: 400000,
    modelSpecificParams: reasoningParameters,
    isDefaultModel: true,
  },
  "gpt-5-2025-08-07": {
    apiName: "gpt-5-2025-08-07",
    displayName: "gpt-5",
    status: "tested",
    notes: "The best model for coding and agentic tasks across domains",
    docLink: "https://platform.openai.com/docs/models/gpt-5",
    tamboDocLink: "https://docs.tambo.co/models/openai#gpt-5",
    inputTokenLimit: 400000,
    modelSpecificParams: reasoningParameters,
    // We can add common parameters defaults here if needed
    // commonParametersDefaults: {
    //   temperature: 1,
    // },
  },
  "gpt-5-mini-2025-08-07": {
    apiName: "gpt-5-mini-2025-08-07",
    displayName: "gpt-5-mini",
    status: "tested",
    notes:
      "A faster, more cost-efficient version of GPT-5 for well-defined tasks",
    docLink: "https://platform.openai.com/docs/models/gpt-5-mini",
    tamboDocLink: "https://docs.tambo.co/models/openai#gpt-5-mini",
    inputTokenLimit: 400000,
    modelSpecificParams: reasoningParameters,
  },
  "gpt-5-nano-2025-08-07": {
    apiName: "gpt-5-nano-2025-08-07",
    displayName: "gpt-5-nano",
    status: "tested",
    notes: "Fastest, most cost-efficient version of GPT-5",
    docLink: "https://platform.openai.com/docs/models/gpt-5-nano",
    tamboDocLink: "https://docs.tambo.co/models/openai#gpt-5-nano",
    inputTokenLimit: 400000,
    modelSpecificParams: reasoningParameters,
  },
  "gpt-4.1-2025-04-14": {
    apiName: "gpt-4.1-2025-04-14",
    displayName: "gpt-4.1",
    status: "tested",
    notes: "Excels at function calling and instruction following",
    docLink: "https://platform.openai.com/docs/models/gpt-4.1",
    tamboDocLink: "https://docs.tambo.co/models/openai#gpt-4-1",
    inputTokenLimit: 1047576,
  },
  "gpt-4.1-nano-2025-04-14": {
    apiName: "gpt-4.1-nano-2025-04-14",
    displayName: "gpt-4.1-nano",
    status: "tested",
    notes: "Fastest, most cost-efficient version of GPT-4.1",
    docLink: "https://platform.openai.com/docs/models/gpt-4.1-nano",
    tamboDocLink: "https://docs.tambo.co/models/openai#gpt-4-1-nano",
    inputTokenLimit: 1047576,
  },
  "gpt-4.1-mini-2025-04-14": {
    apiName: "gpt-4.1-mini-2025-04-14",
    displayName: "gpt-4.1-mini",
    status: "tested",
    notes: "Balanced for intelligence, speed, and cost",
    docLink: "https://platform.openai.com/docs/models/gpt-4.1-mini",
    tamboDocLink: "https://docs.tambo.co/models/openai#gpt-4-1-mini",
    inputTokenLimit: 1047576,
  },
  "o3-2025-04-16": {
    apiName: "o3-2025-04-16",
    displayName: "o3",
    status: "tested",
    notes: "The most powerful reasoning model",
    docLink: "https://platform.openai.com/docs/models/o3",
    tamboDocLink: "https://docs.tambo.co/models/openai#o3",
    inputTokenLimit: 200000,
    modelSpecificParams: reasoningParameters,
  },
  "gpt-4o-2024-11-20": {
    apiName: "gpt-4o-2024-11-20",
    displayName: "gpt-4o",
    status: "tested",
    notes:
      "Versatile and high-intelligence model with text and image input support. Best for most tasks, combining strong reasoning, creativity, and multimodal understanding.",
    docLink: "https://platform.openai.com/docs/models/gpt-4o",
    tamboDocLink: "https://docs.tambo.co/models/openai#gpt-4o",
    inputTokenLimit: 128000,
  },
  "gpt-4o-mini-2024-07-18": {
    apiName: "gpt-4o-mini-2024-07-18",
    displayName: "gpt-4o-mini",
    status: "tested",
    notes:
      "Fast, affordable model ideal for focused tasks and fine-tuning. Supports text and image inputs, with low cost and latency for efficient performance.",
    docLink: "https://platform.openai.com/docs/models/gpt-4o-mini",
    tamboDocLink: "https://docs.tambo.co/models/openai#gpt-4o-mini",
    inputTokenLimit: 128000,
  },
  "gpt-4-turbo-2024-04-09": {
    apiName: "gpt-4-turbo-2024-04-09",
    displayName: "gpt-4-turbo",
    status: "tested",
    notes:
      "High-intelligence model that's cheaper and faster than GPT-4. Still powerful, but we recommend using GPT-4o for most tasks.",
    docLink: "https://platform.openai.com/docs/models/gpt-4-turbo",
    tamboDocLink: "https://docs.tambo.co/models/openai#gpt-4-turbo",
    inputTokenLimit: 128000,
  },
};
