import type { LlmModelConfig } from "../../llm-config-types";

// Atlas Cloud model IDs available via their OpenAI-compatible API
// See https://atlascloud.ai/models
type AtlasCloudModelId =
  | "deepseek-ai/DeepSeek-V3.1-Terminus"
  | "Qwen/Qwen3-235B-A22B-Instruct-2507"
  | "zai-org/glm-4.7"
  | "moonshotai/kimi-k2.6";

// Context limits below are the values the gateway's public catalog
// (GET https://api.atlascloud.ai/v1/models) reports for each model.
export const atlasCloudModels: Partial<LlmModelConfig<AtlasCloudModelId>> = {
  "deepseek-ai/DeepSeek-V3.1-Terminus": {
    apiName: "deepseek-ai/DeepSeek-V3.1-Terminus",
    displayName: "DeepSeek V3.1 Terminus",
    status: "untested",
    notes:
      "DeepSeek's V3.1 Terminus on Atlas Cloud, a reasoning-capable model with tool calling.",
    docLink: "https://atlascloud.ai/models",
    tamboDocLink:
      "https://docs.tambo.co/reference/llm-providers/atlascloud#deepseek-v31-terminus",
    inputTokenLimit: 131072,
    supportsSkills: false,
  },
  "Qwen/Qwen3-235B-A22B-Instruct-2507": {
    apiName: "Qwen/Qwen3-235B-A22B-Instruct-2507",
    displayName: "Qwen 3 235B A22B Instruct",
    status: "untested",
    notes:
      "Alibaba's Qwen 3 235B instruct model on Atlas Cloud, with tool calling.",
    docLink: "https://atlascloud.ai/models",
    tamboDocLink:
      "https://docs.tambo.co/reference/llm-providers/atlascloud#qwen-3-235b-a22b-instruct",
    inputTokenLimit: 131072,
    supportsSkills: false,
  },
  "zai-org/glm-4.7": {
    apiName: "zai-org/glm-4.7",
    displayName: "GLM 4.7",
    status: "untested",
    notes:
      "Zhipu AI's GLM 4.7 on Atlas Cloud, a reasoning-capable model with tool calling.",
    docLink: "https://atlascloud.ai/models",
    tamboDocLink:
      "https://docs.tambo.co/reference/llm-providers/atlascloud#glm-47",
    inputTokenLimit: 202752,
    supportsSkills: false,
  },
  "moonshotai/kimi-k2.6": {
    apiName: "moonshotai/kimi-k2.6",
    displayName: "Kimi K2.6",
    status: "untested",
    notes:
      "Moonshot's Kimi K2.6 on Atlas Cloud, a long-context model with tool calling.",
    docLink: "https://atlascloud.ai/models",
    tamboDocLink:
      "https://docs.tambo.co/reference/llm-providers/atlascloud#kimi-k26",
    inputTokenLimit: 262144,
    supportsSkills: false,
  },
};
