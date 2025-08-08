import { LlmModelConfig } from "../llm-config-types";

export const groqModels: LlmModelConfig = {
  "llama-3.3-70b-versatile": {
    apiName: "llama-3.3-70b-versatile",
    displayName: "Llama 3.3 70B Versatile",
    status: "untested",
    notes:
      "Llama 3.3 70B Versatile is Meta's powerful multilingual model, optimized for diverse NLP tasks. Delivers strong performance with 70B parameters.",
    docLink: "https://console.groq.com/docs/model/llama-3.3-70b-versatile",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 131072,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "llama-3.1-8b-instant": {
    apiName: "llama-3.1-8b-instant",
    displayName: "Llama 3.1 8B Instant",
    status: "untested",
    notes:
      "Llama 3.1 8B on Groq delivers fast, high-quality responses for real-time tasks. Supports function calling, JSON output, and 128K context at low cost.",
    docLink: "https://console.groq.com/docs/model/llama-3.1-8b-instant",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 131072,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
};
