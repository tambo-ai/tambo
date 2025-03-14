export interface LegacyComponentDecision {
  componentName: string | null;
  props: any | null;
  message: string;
  suggestedActions?: SuggestedAction[];
  toolCallRequest?: ToolCallRequest;
}

export interface ComponentDecisionV2 {
  componentName: string | null;
  props: any | null;
  message: string;
}

export interface ToolCallRequest {
  toolName: string;
  tool_call_id: string;
  parameters: {
    parameterName: string;
    parameterValue: any;
  }[];
}

export interface SuggestedAction {
  label: string;
  actionText: string;
}
