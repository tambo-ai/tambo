export enum AiProviderType {
  LLM = "llm",
  AGENT = "agent",
}

export enum AgentProviderType {
  /** Generic AG-UI provider */
  AGUI = "ag-ui",
  /** Mastra provider */
  MASTRA = "mastra",
  /** CrewAI provider */
  CREWAI = "crewai",
  /** LlamaIndex provider */
  LLAMAINDEX = "llamaindex",
  /** LangGraph provider */
  LANGGRAPH = "langgraph",
  /** Pydantic provider */
  PYDANTICAI = "pydanticai",
}
