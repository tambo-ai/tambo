import { LlmModelConfig } from "../llm-config-types";

export const geminiModels: LlmModelConfig = {
  "gemini-2.5-pro": {
    apiName: "gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    status: "known-issues",
    notes:
      "Gemini 2.5 Pro is Google's most advanced reasoning model, capable of solving complex problems.",
    docLink:
      "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-pro",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 1048576,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gemini-2.5-flash": {
    apiName: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    status: "known-issues",
    notes:
      "Gemini 2.5 Flash is Google's best model in terms of price and performance, and offers well-rounded capabilities.",
    docLink:
      "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 1048576,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gemini-2.0-flash": {
    apiName: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    status: "known-issues",
    notes:
      "Gemini 2.0 Flash delivers next-generation features and improved capabilities designed for the agentic era, including superior speed, built-in tool use, multimodal generation, and a 1M token context window.",
    docLink:
      "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-0-flash",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 1048576,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gemini-2.0-flash-lite": {
    apiName: "gemini-2.0-flash-lite",
    displayName: "Gemini 2.0 Flash Lite",
    status: "known-issues",
    notes:
      "Gemini 2.0 Flash Lite is a model optimized for cost efficiency and low latency.",
    docLink:
      "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-0-flash-lite",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 1048576,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
};
