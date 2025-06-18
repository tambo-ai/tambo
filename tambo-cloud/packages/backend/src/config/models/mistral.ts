import { LlmModelConfig } from "../llm-config-types";

export const mistralModels: LlmModelConfig = {
  "mistral-small-latest": {
    apiName: "mistral-small-latest",
    displayName: "Mistral Small",
    status: "untested",
    notes:
      "Mistral Small is a compact, open-source model with multimodal support and 128K context. Fast and efficient for real-time tasks like chatbots and coding.",
    docLink: "https://mistral.ai/news/mistral-small-3-1",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      inputTokenLimit: 128000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "mistral-large-latest": {
    apiName: "mistral-large-latest",
    displayName: "Mistral Large",
    status: "untested",
    notes:
      "Mistral Large is Mistral's top-tier reasoning model for complex tasks, with latest version released in Nov 2024. Best for advanced problem-solving and analysis.",
    docLink: "https://mistral.ai/news/pixtral-large",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      inputTokenLimit: 128000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
};
