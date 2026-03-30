import type { LlmModelConfig } from "../../llm-config-types";

// Cerebras model IDs available via their OpenAI-compatible API
// See https://inference-docs.cerebras.ai/models/overview
type CerebrasModelId =
  | "llama3.1-8b"
  | "gpt-oss-120b"
  | "qwen-3-235b-a22b-instruct-2507"
  | "zai-glm-4.7";

// Note: Cerebras free tier limits all models to 8,192 tokens.
// The inputTokenLimit values below reflect the full model capabilities on paid tiers.
export const cerebrasModels: Partial<LlmModelConfig<CerebrasModelId>> = {
  "llama3.1-8b": {
    apiName: "llama3.1-8b",
    displayName: "Llama 3.1 8B",
    status: "untested",
    notes:
      "Meta's Llama 3.1 8B model on Cerebras, ideal for fast inference at ~2,200 tokens/sec.",
    docLink: "https://inference-docs.cerebras.ai/models/llama-31-8b",
    tamboDocLink:
      "https://docs.tambo.co/reference/llm-providers/cerebras#llama31-8b",
    inputTokenLimit: 128000,
  },
  "gpt-oss-120b": {
    apiName: "gpt-oss-120b",
    displayName: "GPT-OSS 120B",
    status: "untested",
    notes:
      "OpenAI open-weight 120B parameter model on Cerebras at ~3,000 tokens/sec.",
    docLink: "https://inference-docs.cerebras.ai/models/openai-oss",
    tamboDocLink:
      "https://docs.tambo.co/reference/llm-providers/cerebras#gpt-oss-120b",
    inputTokenLimit: 8192,
  },
  "qwen-3-235b-a22b-instruct-2507": {
    apiName: "qwen-3-235b-a22b-instruct-2507",
    displayName: "Qwen 3 235B A22B Instruct",
    status: "untested",
    notes:
      "Alibaba's large-scale Qwen 3 model (235B params) on Cerebras at ~1,400 tokens/sec. Preview model.",
    docLink: "https://inference-docs.cerebras.ai/models/qwen-3-235b-2507",
    tamboDocLink:
      "https://docs.tambo.co/reference/llm-providers/cerebras#qwen-3-235b-a22b-instruct-2507",
    inputTokenLimit: 32768,
  },
  "zai-glm-4.7": {
    apiName: "zai-glm-4.7",
    displayName: "ZAI GLM 4.7",
    status: "untested",
    notes:
      "Zhipu AI's GLM 4.7 (355B params) on Cerebras at ~1,000 tokens/sec. Preview model.",
    docLink: "https://inference-docs.cerebras.ai/models/zai-glm-47",
    tamboDocLink:
      "https://docs.tambo.co/reference/llm-providers/cerebras#zai-glm-47",
    inputTokenLimit: 128000,
  },
};
