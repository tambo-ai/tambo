import { LlmModelConfig } from "../llm-config-types";

export const mistralModels: LlmModelConfig = {
  "mistral-medium-2505": {
    apiName: "mistral-medium-2505",
    displayName: "Mistral Medium 3",
    status: "known-issues",
    notes:
      "Mistral Medium 3 is designed to be frontier-class, particularly in categories of professional use.",
    docLink: "https://mistral.ai/news/mistral-medium-3",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 128000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "codestral-2508": {
    apiName: "codestral-2508",
    displayName: "CodeStral 2508",
    status: "tested",
    notes:
      "Codestral specializes in low-latency, high-frequency tasks such as fill-in-the-middle (FIM), code correction and test generation.",
    docLink: "https://mistral.ai/news/codestral-25-08",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 256000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "magistral-medium-2506": {
    apiName: "magistral-medium-2506",
    displayName: "Magistral Medium 1",
    status: "tested",
    notes:
      "Magistral Medium 1 is a frontier-class reasoning model released June 2025.",
    docLink: "https://mistral.ai/news/magistral",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 40000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "mistral-large-2411": {
    apiName: "mistral-large-2411",
    displayName: "Mistral Large 2.1",
    status: "known-issues",
    notes:
      "Mistral Large 2.1 is Mistral's top-tier large model for high-complexity tasks with the lastest version released November 2024.",
    docLink: "https://mistral.ai/news/pixtral-large",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 128000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
};
