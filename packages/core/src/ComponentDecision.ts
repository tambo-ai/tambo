import { MessageRole } from "./threads";

export interface LegacyComponentDecision {
  /** This is an internal id for noticing when multiple messages come out of a stream */
  id?: string;
  role?: MessageRole;
  parentMessageId?: string;
  componentName: string | null;
  props: Record<string, unknown> | null;
  message: string;
  toolCallRequest?: ToolCallRequest;
  toolCallId?: string;
  componentState: Record<string, unknown> | null;
  reasoning?: string[];
  reasoningDurationMS?: number;
  statusMessage?: string;
  completionStatusMessage?: string;
  isToolCallFinished?: boolean;
}

export interface ComponentDecisionV2 {
  /** This is an internal id for noticing when multiple messages come out of a stream */
  id?: string;
  role?: MessageRole;
  componentName: string | null;
  props: Record<string, unknown>;
  message: string;
  componentState: Record<string, unknown> | null;
}

export interface ToolCallRequest {
  toolName: string;
  /** @deprecated - The enclosing message's tool_call_id is used instead */
  tool_call_id?: string;
  parameters: {
    parameterName: string;
    parameterValue: unknown;
  }[];
}

export interface SuggestedAction {
  label: string;
  actionText: string;
}
