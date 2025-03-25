export interface LegacyComponentDecision {
  componentName: string | null;
  props: any | null;
  message: string;
  suggestedActions?: SuggestedAction[];
  toolCallRequest?: ToolCallRequest;
  toolCallId?: string;
  state: Record<string, unknown> | null;
  reasoning: string;
}

export interface ComponentDecisionV2 {
  componentName: string | null;
  props: Record<string, unknown>;
  message: string;
  state: Record<string, unknown> | null;
  reasoning: string;
}

export interface ToolCallRequest {
  toolName: string;
  /** @deprecated - The enclosing message's tool_call_id is used instead */
  tool_call_id?: string;
  parameters: {
    parameterName: string;
    parameterValue: any;
  }[];
}

export interface SuggestedAction {
  label: string;
  actionText: string;
}
