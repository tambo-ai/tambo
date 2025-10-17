import { AnthropicProvider } from "@ai-sdk/anthropic";
import type { LlmModelConfig } from "../../llm-config-types";

type NarrowStrings<T> = T extends string
  ? string extends T
    ? never // this branch matches the wide `string` member
    : T // keep actual literals / narrower string types
  : never;

type RawModelIds = Parameters<AnthropicProvider["languageModel"]>[0];
type AnthropicModelId = NarrowStrings<RawModelIds>;
export const anthropicModels: Partial<LlmModelConfig<AnthropicModelId>> = {
  "claude-sonnet-4-5-20250929": {
    apiName: "claude-sonnet-4-5-20250929",
    displayName: "Claude Sonnet 4.5",
    status: "tested",
    notes:
      "Claude 4.5 Sonnet is Anthropic's best model for coding and reasoning.",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://docs.tambo.co",
    inputTokenLimit: 200000,
  },
  "claude-haiku-4-5-20251001": {
    apiName: "claude-haiku-4-5-20251001",
    displayName: "Claude Haiku 4.5",
    status: "tested",
    notes: "Claude 4.5 Haiku is Anthropic's fastest and most intelligent model",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://docs.tambo.co",
    inputTokenLimit: 200000,
  },
  "claude-opus-4-1-20250805": {
    apiName: "claude-opus-4-1-20250805",
    displayName: "Claude Opus 4.1",
    status: "tested",
    notes:
      "Claude Opus 4.1 is Anthropic's most powerful model yet, with highest level of intelligence and capability",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://docs.tambo.co",
    inputTokenLimit: 200000,
  },
  "claude-opus-4-20250514": {
    apiName: "claude-opus-4-20250514",
    displayName: "Claude Opus 4",
    status: "tested",
    notes:
      "Claude Opus 4 has very high intelligence and capability. It is a good model for coding and reasoning.",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://docs.tambo.co",
    inputTokenLimit: 200000,
  },
  "claude-sonnet-4-20250514": {
    apiName: "claude-sonnet-4-20250514",
    displayName: "Claude Sonnet 4",
    status: "tested",
    notes:
      "Claude 4 Sonnet is Anthropic's high-performance model with exceptional reasoning and efficiency.",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://docs.tambo.co",
    inputTokenLimit: 200000,
  },
  "claude-3-7-sonnet-20250219": {
    apiName: "claude-3-7-sonnet-20250219",
    displayName: "Claude Sonnet 3.7",
    status: "tested",
    notes:
      "Claude 3.7 Sonnet is Anthropic's smartest model yet, with fast or step-by-step thinking. Great for coding and front-end development.",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://docs.tambo.co",
    inputTokenLimit: 200000,
  },
  "claude-3-5-haiku-20241022": {
    apiName: "claude-3-5-haiku-20241022",
    displayName: "Claude Haiku 3.5",
    status: "known-issues",
    notes:
      "Claude 3.5 Haiku is Anthropic's fastest and most affordable model. Great for real-time tasks like chatbots, coding, and data extraction.",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://docs.tambo.co",
    inputTokenLimit: 200000,
  },
};
