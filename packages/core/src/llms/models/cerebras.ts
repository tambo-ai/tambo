import type { LlmModelConfig } from "../../llm-config-types";

// Cerebras model IDs available via their OpenAI-compatible API
type CerebrasModelId =
  | "llama3.1-8b"
  | "llama-3.3-70b"
  | "qwen-3-32b"
  | "gpt-oss-120b"
  | "qwen-3-235b-a22b-instruct-2507"
  | "zai-glm-4.6"
  | "zai-glm-4.7";

// Note: Cerebras free tier limits all models to 8,192 tokens.
// The inputTokenLimit values below reflect the full model capabilities on paid tiers.
export const cerebrasModels: Partial<LlmModelConfig<CerebrasModelId>> = {
  "llama3.1-8b": {
    apiName: "llama3.1-8b",
    displayName: "Llama 3.1 8B",
    status: "untested",
    notes:
      "Meta's Llama 3.1 8B model on Cerebras, ideal for fast inference at 2,000+ tokens/sec. Best for simple tasks and cost-effective deployments.",
    docLink: "https://inference-docs.cerebras.ai/",
    tamboDocLink: "https://docs.tambo.co/models/cerebras#llama31-8b",
    inputTokenLimit: 128000,
  },
  "llama-3.3-70b": {
    apiName: "llama-3.3-70b",
    displayName: "Llama 3.3 70B",
    status: "untested",
    notes:
      "Meta's Llama 3.3 70B model on Cerebras, offering balanced performance with ultra-fast inference. Suitable for complex reasoning and multi-step tasks.",
    docLink: "https://inference-docs.cerebras.ai/",
    tamboDocLink: "https://docs.tambo.co/models/cerebras#llama-33-70b",
    inputTokenLimit: 128000,
  },
  "qwen-3-32b": {
    apiName: "qwen-3-32b",
    displayName: "Qwen 3 32B",
    status: "untested",
    notes:
      "Alibaba's Qwen 3 32B model with hybrid reasoning capabilities on Cerebras. Good for multilingual tasks and structured outputs.",
    docLink: "https://inference-docs.cerebras.ai/",
    tamboDocLink: "https://docs.tambo.co/models/cerebras#qwen-3-32b",
    inputTokenLimit: 32768,
  },
  "gpt-oss-120b": {
    apiName: "gpt-oss-120b",
    displayName: "GPT-OSS 120B",
    status: "untested",
    notes:
      "OpenAI open-weight 120B parameter model on Cerebras. Powerful capabilities for demanding applications with Cerebras's fast inference.",
    docLink: "https://inference-docs.cerebras.ai/",
    tamboDocLink: "https://docs.tambo.co/models/cerebras#gpt-oss-120b",
    inputTokenLimit: 8192,
  },
  "qwen-3-235b-a22b-instruct-2507": {
    apiName: "qwen-3-235b-a22b-instruct-2507",
    displayName: "Qwen 3 235B A22B Instruct",
    status: "untested",
    notes:
      "Alibaba's large-scale Qwen 3 model (235B params, A22B architecture) optimized for instruction following on Cerebras.",
    docLink: "https://inference-docs.cerebras.ai/",
    tamboDocLink:
      "https://docs.tambo.co/models/cerebras#qwen-3-235b-a22b-instruct-2507",
    inputTokenLimit: 32768,
  },
  "zai-glm-4.6": {
    apiName: "zai-glm-4.6",
    displayName: "ZAI GLM 4.6",
    status: "untested",
    notes:
      "Zhipu AI's GLM 4.6 model on Cerebras with fast inference capabilities.",
    docLink: "https://inference-docs.cerebras.ai/",
    tamboDocLink: "https://docs.tambo.co/models/cerebras#zai-glm-46",
    inputTokenLimit: 128000,
  },
  "zai-glm-4.7": {
    apiName: "zai-glm-4.7",
    displayName: "ZAI GLM 4.7",
    status: "untested",
    notes:
      "Zhipu AI's GLM 4.7 model on Cerebras, the latest iteration with improved capabilities.",
    docLink: "https://inference-docs.cerebras.ai/",
    tamboDocLink: "https://docs.tambo.co/models/cerebras#zai-glm-47",
    inputTokenLimit: 128000,
  },
};
