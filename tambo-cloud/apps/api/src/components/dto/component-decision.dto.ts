import {
  SuggestedAction as SuggestedActionInterface,
  ToolCallRequest as ToolCallRequestInterface,
} from '@use-hydra-ai/hydra-ai-server';

export class ComponentDecision {
  componentName?: string | null;
  props?: Record<string, any>;
  message?: string;
  suggestedActions?: SuggestedAction[];
  toolCallRequest?: ToolCallRequest;
  threadId?: string;
}

export class ToolCallRequest implements Partial<ToolCallRequestInterface> {
  toolCallId?: string;
  tool?: string;
  parameters?: {
    parameterName: string;
    parameterValue: any;
  }[];
  toolName?: string;
}

export class SuggestedAction implements Partial<SuggestedActionInterface> {
  label?: string;
  actionText?: string;
}
