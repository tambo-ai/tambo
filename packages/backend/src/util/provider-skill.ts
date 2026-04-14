/** A completed provider-managed skill tool invocation. */
export interface ProviderSkillCall {
  readonly toolCallId: string;
  readonly toolName: "load_skill";
  /** Raw JSON arguments string as accumulated from the provider's tool-input-delta events. */
  readonly args: string;
  /**
   * The provider's tool execution result. Shape varies by provider:
   * OpenAI shell returns a string; Anthropic code_execution returns
   * a structured object.
   */
  readonly result: unknown;
}

/**
 * Check whether a message was created to record a provider-managed skill tool call.
 * Used to filter these messages out of the LLM conversation history.
 * @returns true when the message has `metadata._tambo.providerSkill === true`
 */
export function isProviderSkillMessage(msg: {
  metadata?: Record<string, unknown> | null;
}): boolean {
  const tambo = (msg.metadata as Record<string, unknown> | undefined)?._tambo;
  return (
    typeof tambo === "object" &&
    tambo !== null &&
    (tambo as Record<string, unknown>).providerSkill === true
  );
}
