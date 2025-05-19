import { LlmModelConfig } from "../llm-config-types";

export const anthropicModels: LlmModelConfig = {
  "claude-3-7-sonnet-latest": {
    apiName: "claude-3-7-sonnet-latest",
    displayName: "Claude 3.7 Sonnet",
    status: "tested",
    notes:
      "Claude 3.7 Sonnet is Anthropic's smartest model yet, with fast or step-by-step thinking. Great for coding and front-end development.",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "claude-3-5-sonnet-latest": {
    apiName: "claude-3-5-sonnet-latest",
    displayName: "Claude 3.5 Sonnet",
    status: "tested",
    notes:
      "Claude 3.5 Sonnet is a fast, mid-tier model with top-tier intelligence and vision capabilities. Ideal for coding, reasoning, and complex workflows.",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "claude-3-5-haiku-20241022": {
    apiName: "claude-3-5-haiku-20241022",
    displayName: "Claude 3.5 Haiku",
    status: "tested",
    notes:
      "Claude 3.5 Haiku is Anthropic's fastest and most affordable model. Great for real-time tasks like chatbots, coding, and data extraction.",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "claude-3-opus-20240229": {
    apiName: "claude-3-opus-20240229",
    displayName: "Claude 3 Opus",
    status: "tested",
    notes:
      "Claude 3 Opus is Anthropic's most advanced model, built for deep reasoning, coding, and high-accuracy tasks. Ideal for enterprise-grade use.",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "claude-3-sonnet-20240229": {
    apiName: "claude-3-sonnet-20240229",
    displayName: "Claude 3 Sonnet",
    status: "tested",
    notes:
      "Claude 3 Sonnet is a balanced model with strong reasoning, coding, and vision performance. Great for fast, cost-efficient enterprise use.",
    docLink: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
};
