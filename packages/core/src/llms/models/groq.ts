import { type GroqProvider } from "@ai-sdk/groq";
import type { LlmModelConfig } from "../../llm-config-types";
import { type NarrowStrings } from "../../typeutils";
type RawModelIds = Parameters<GroqProvider["languageModel"]>[0];
type GroqModelId = NarrowStrings<RawModelIds>;
export const groqModels: Partial<LlmModelConfig<GroqModelId>> = {
  "meta-llama/llama-4-scout-17b-16e-instruct": {
    apiName: "meta-llama/llama-4-scout-17b-16e-instruct",
    displayName: "Llama 4 Scout",
    status: "untested",
    notes:
      "Meta's Llama 4 Scout model (17Bx16E), ideal for summarization, reasoning, and code. Runs at 460+ tokens/sec on Groq",
    docLink:
      "https://groq.com/blog/llama-4-now-live-on-groq-build-fast-at-the-lowest-cost-without-compromise",
    tamboDocLink:
      "https://docs.tambo.co/models/groq#llama-4-scout-17b-16e-instruct",
    inputTokenLimit: 131072,
  },
  "meta-llama/llama-4-maverick-17b-128e-instruct": {
    apiName: "meta-llama/llama-4-maverick-17b-128e-instruct",
    displayName: "Llama 4 Maverick",
    status: "untested",
    notes:
      "Meta's Llama 4 Maverick model (17Bx128E), optimized for multilingual and multimodal tasks—great for assistants, chat, and creative applications",
    docLink:
      "https://groq.com/blog/llama-4-now-live-on-groq-build-fast-at-the-lowest-cost-without-compromise",
    tamboDocLink:
      "https://docs.tambo.co/models/groq#llama-4-maverick-17b-128e-instruct",
    inputTokenLimit: 131072,
  },
  "llama-3.3-70b-versatile": {
    apiName: "llama-3.3-70b-versatile",
    displayName: "Llama 3.3 70B Versatile",
    status: "untested",
    notes:
      "Llama 3.3 70B Versatile is Meta's powerful multilingual model, optimized for diverse NLP tasks. Delivers strong performance with 70B parameters.",
    docLink: "https://console.groq.com/docs/model/llama-3.3-70b-versatile",
    tamboDocLink: "https://docs.tambo.co/models/groq#llama-3-3-70b-versatile",
    inputTokenLimit: 131072,
  },
  "llama-3.1-8b-instant": {
    apiName: "llama-3.1-8b-instant",
    displayName: "Llama 3.1 8B Instant",
    status: "tested",
    notes:
      "Llama 3.1 8B on Groq delivers fast, high-quality responses for real-time tasks. Supports function calling, JSON output, and 128K context at low cost.",
    docLink: "https://console.groq.com/docs/model/llama-3.1-8b-instant",
    tamboDocLink: "https://docs.tambo.co/models/groq#llama-3-1-8b-instant",
    inputTokenLimit: 131072,
  },
};
