export interface ComponentDecision {
  componentName: string | null;
  props: any | null;
  message: string;
  suggestedActions?: SuggestedAction[];
  toolCallRequest?: ToolCallRequest;
  threadId: string;
}

export interface ComponentDecisionV2 {
  componentName: string | null;
  props: any | null;
  message: string;
}

export interface ToolCallRequest {
  toolName: string;
  parameters: {
    parameterName: string;
    parameterValue: any;
  }[];
}

export interface SuggestedAction {
  label: string;
  actionText: string;
}
