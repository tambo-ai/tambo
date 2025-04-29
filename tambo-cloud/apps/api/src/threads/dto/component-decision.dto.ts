import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { ComponentDecisionV2, ToolCallRequest } from "@tambo-ai-cloud/core";

@ApiSchema({ name: "ComponentDecisionV2" })
export class ComponentDecisionV2Dto implements ComponentDecisionV2 {
  componentName!: string | null;
  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  props!: Record<string, any>;
  message!: string;
  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  componentState!: Record<string, unknown> | null;
  reasoning!: string;
  statusMessage?: string;
  completionStatusMessage?: string;
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
