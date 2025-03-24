import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  ComponentDecisionV2,
  SuggestedAction,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import { ThreadMessageDto } from "../../threads/dto/message.dto";

/** Legacy - for v1 of generate/hydrate */
@ApiSchema({ name: "ComponentDecision" })
export class ComponentDecisionDto {
  componentName!: string | null;
  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  props!: Record<string, any>;
  message!: string;
  suggestedActions?: SuggestedActionDto[];
  toolCallRequest?: ToolCallRequestDto;
  threadId!: string;
}

@ApiSchema({ name: "ComponentDecisionV2" })
export class ComponentDecisionV2Dto implements ComponentDecisionV2 {
  componentName!: string | null;
  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  props!: Record<string, any>;
  message!: string;
}

export class ToolParameter {
  parameterName!: string;
  parameterValue!: any;
}

@ApiSchema({ name: "ToolCallRequest" })
export class ToolCallRequestDto implements Partial<ToolCallRequest> {
  /** @deprecated - The enclosing message's tool_call_id is used instead */
  tool_call_id?: string;
  tool?: string;
  parameters!: ToolParameter[];
  toolName!: string;
}

/** @deprecated - Used only for v1 compatibility */
@ApiSchema({ name: "SuggestedAction" })
export class SuggestedActionDto implements Partial<SuggestedAction> {
  label!: string;
  actionText!: string;
}

export class GenerateComponentResponse {
  message!: ThreadMessageDto;
}
