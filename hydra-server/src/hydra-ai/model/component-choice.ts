export interface ComponentDecision {
  componentName: string | null;
  props: any | null;
  message: string;
  toolCallRequest?: ToolCallRequest;
}

export interface ToolCallRequest {
  toolName: string;
  parameters: {
    parameterName: string;
    parameterValue: any;
  }[];
}
