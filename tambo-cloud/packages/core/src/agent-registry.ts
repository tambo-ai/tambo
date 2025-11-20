import { AgentProviderType } from "./ai-providers";

export type AgentProviderInfo = Readonly<{
  type: AgentProviderType;
  name: string;
  isSupported: boolean;
}>;

// The order of this array determines UI ordering (e.g., dropdown lists)
export const AGENT_PROVIDER_REGISTRY: ReadonlyArray<AgentProviderInfo> = [
  { type: AgentProviderType.CREWAI, name: "CrewAI", isSupported: true },
  {
    type: AgentProviderType.LLAMAINDEX,
    name: "LlamaIndex",
    isSupported: true,
  },
  { type: AgentProviderType.MASTRA, name: "Mastra", isSupported: true },
  { type: AgentProviderType.LANGGRAPH, name: "LangGraph", isSupported: false },
  {
    type: AgentProviderType.PYDANTICAI,
    name: "Pydantic AI",
    isSupported: true,
  },
] as const;

export function getAgentProviderInfo(
  type: AgentProviderType,
): AgentProviderInfo | undefined {
  return AGENT_PROVIDER_REGISTRY.find((info) => info.type === type);
}
