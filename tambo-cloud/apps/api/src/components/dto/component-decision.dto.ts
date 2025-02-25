import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { SuggestedAction, ToolCallRequest } from '@use-hydra-ai/core';
import { ThreadMessageDto } from '../../threads/dto/message.dto';

/** Legacy - for v1 of generate/hydrate */
export class ComponentDecision {
  componentName!: string | null;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  props!: Record<string, any>;
  message!: string;
  suggestedActions?: SuggestedActionDto[];
  toolCallRequest?: ToolCallRequestDto;
  threadId!: string;
}

export class ComponentDecisionV2 {
  componentName!: string | null;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  props!: Record<string, any>;
  message!: string;
}

export class ToolParameter {
  parameterName!: string;
  parameterValue!: any;
}

@ApiSchema({ name: 'ToolCallRequest' })
export class ToolCallRequestDto implements Partial<ToolCallRequest> {
  toolCallId?: string;
  tool?: string;
  parameters!: ToolParameter[];
  toolName!: string;
}

/** @deprecated - Used only for v1 compatibility */
@ApiSchema({ name: 'SuggestedAction' })
export class SuggestedActionDto implements Partial<SuggestedAction> {
  label!: string;
  actionText!: string;
}

export class GenerateComponentResponse {
  message!: ThreadMessageDto;
}
