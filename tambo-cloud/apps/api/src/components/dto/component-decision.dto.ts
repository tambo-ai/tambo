import {
  SuggestedAction as SuggestedActionInterface,
  ToolCallRequest as ToolCallRequestInterface,
} from '@use-hydra-ai/core';
import { ThreadMessageDto } from '../../threads/dto/message.dto';

/** Legacy - for v1 of generate/hydrate */
export class ComponentDecision {
  componentName!: string | null;
  props!: Record<string, any>;
  message!: string;
  suggestedActions?: SuggestedAction[];
  toolCallRequest?: ToolCallRequest;
  threadId!: string;
}

export class ComponentDecisionV2 {
  componentName!: string | null;
  props!: Record<string, any>;
  message!: string;
}

export class ToolParameter {
  parameterName!: string;
  parameterValue!: any;
}

export class ToolCallRequest implements Partial<ToolCallRequestInterface> {
  toolCallId?: string;
  tool?: string;
  parameters!: ToolParameter[];
  toolName!: string;
}

/** @deprecated - Used only for v1 compatibility */
export class SuggestedAction implements Partial<SuggestedActionInterface> {
  label!: string;
  actionText!: string;
}

export class GenerateComponentResponse {
  message!: ThreadMessageDto;
}
