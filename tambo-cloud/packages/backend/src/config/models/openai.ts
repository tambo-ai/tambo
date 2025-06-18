import { LlmModelConfig } from "../llm-config-types";

export const openaiModels: LlmModelConfig = {
  "gpt-4.5-preview": {
    apiName: "gpt-4.5-preview",
    displayName: "gpt-4.5 Preview",
    status: "tested",
    notes:
      "Most advanced and capable model from OpenAI, great for complex reasoning and creative tasks. Ideal for writing, learning, and exploring open-ended ideas.",
    docLink: "https://platform.openai.com/docs/models/gpt-4.5-preview",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      inputTokenLimit: 128000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gpt-4.1": {
    apiName: "gpt-4.1",
    displayName: "gpt-4.1",
    status: "tested",
    notes:
      "Most capable GPT model with strong world knowledge and user intent understanding. Excels at creative tasks, complex reasoning, and open-ended exploration.",
    docLink: "https://platform.openai.com/docs/models/gpt-4.1",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      inputTokenLimit: 1047576,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gpt-4o": {
    apiName: "gpt-4o",
    displayName: "gpt-4o",
    status: "tested",
    notes:
      "Versatile and high-intelligence model with text and image input support. Best for most tasks, combining strong reasoning, creativity, and multimodal understanding.",
    docLink: "https://platform.openai.com/docs/models/gpt-4o",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      inputTokenLimit: 128000,
      supportsTools: true,
      supportsJsonMode: true,
    },
    isDefaultModel: true,
  },
  "gpt-4o-mini": {
    apiName: "gpt-4o-mini",
    displayName: "gpt-4o-mini",
    status: "tested",
    notes:
      "Fast, affordable model ideal for focused tasks and fine-tuning. Supports text and image inputs, with low cost and latency for efficient performance.",
    docLink: "https://platform.openai.com/docs/models/gpt-4o-mini",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      inputTokenLimit: 128000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gpt-4-turbo": {
    apiName: "gpt-4-turbo",
    displayName: "gpt-4-turbo",
    status: "tested",
    notes:
      "High-intelligence model that's cheaper and faster than GPT-4. Still powerful, but we recommend using GPT-4o for most tasks.",
    docLink: "https://platform.openai.com/docs/models/gpt-4-turbo",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      inputTokenLimit: 128000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
};
