export interface LegacyComponentDecision {
  id?: string;
  componentName: string | null;
  props: any | null;
  message: string;
  toolCallRequest?: ToolCallRequest;
  toolCallId?: string;
  componentState: Record<string, unknown> | null;
  reasoning: string;
  statusMessage?: string;
  completionStatusMessage?: string;
}

export interface ComponentDecisionV2 {
  componentName: string | null;
  props: Record<string, unknown>;
  message: string;
  componentState: Record<string, unknown> | null;
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
