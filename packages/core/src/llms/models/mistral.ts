import { type MistralProvider } from "@ai-sdk/mistral";
import type { LlmModelConfig } from "../../llm-config-types";
import { type NarrowStrings } from "../../typeutils";
type RawModelIds = Parameters<MistralProvider["languageModel"]>[0];
type MistralModelId = NarrowStrings<RawModelIds>;
export const mistralModels: Partial<LlmModelConfig<MistralModelId>> = {
  "mistral-medium-2505": {
    apiName: "mistral-medium-2505",
    displayName: "Mistral Medium 3",
    status: "known-issues",
    notes:
      "Mistral Medium 3 is designed to be frontier-class, particularly in categories of professional use.",
    docLink: "https://mistral.ai/news/mistral-medium-3",
    tamboDocLink: "https://docs.tambo.co/models/mistral#mistral-medium-3",
    inputTokenLimit: 128000,
  },
  "magistral-medium-2506": {
    apiName: "magistral-medium-2506",
    displayName: "Magistral Medium 1",
    status: "tested",
    notes:
      "Magistral Medium 1 is a frontier-class reasoning model released June 2025.",
    docLink: "https://mistral.ai/news/magistral",
    tamboDocLink: "https://docs.tambo.co/models/mistral#magistral-medium-1",
    inputTokenLimit: 40000,
  },
  "mistral-large-latest": {
    apiName: "mistral-large-latest",
    displayName: "Mistral Large 2.1",
    status: "known-issues",
    notes:
      "Mistral Large 2.1 is Mistral's top-tier large model for high-complexity tasks with the lastest version released November 2024.",
    docLink: "https://mistral.ai/news/pixtral-large",
    tamboDocLink: "https://docs.tambo.co/models/mistral#mistral-large-21",
    inputTokenLimit: 128000,
  },
};
