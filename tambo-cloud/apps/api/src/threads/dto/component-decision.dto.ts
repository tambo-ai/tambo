import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { ComponentDecisionV2, ToolCallRequest } from "@tambo-ai-cloud/core";

export class ToolParameter {
  parameterName!: string;
  parameterValue!: any;
}

@ApiSchema({ name: "ToolCallRequest" })
export class ToolCallRequestDto implements Partial<ToolCallRequest> {
  /** @deprecated - The enclosing message's tool_call_id is used instead */
  @ApiProperty({
    deprecated: true,
    description: "The unique id of the tool call, no longer used.",
  })
  tool_call_id?: string;
  @ApiProperty({
    description: "The parameters of the function to call.",
  })
  parameters!: ToolParameter[];
  @ApiProperty({
    description: "The name of the function to call.",
  })
  toolName!: string;
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
  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  componentState!: Record<string, unknown> | null;
  statusMessage?: string;
  completionStatusMessage?: string;
  /** This is filled in whether the tool call is a server-side or client-side tool call. */
  @ApiProperty({
    description:
      "The tool call request. This is filled in whether the tool call is a server-side or client-side tool call.",
  })
  toolCallRequest?: ToolCallRequestDto;
  @ApiProperty({
    example: {
      parameters: [{ parameterName: "name", parameterValue: "John Doe" }],
      toolName: "get_user_info",
    } satisfies ToolCallRequestDto,
    description:
      "The unique id of the tool call. This is filled in whether the tool call is a server-side or client-side tool call.",
  })
  toolCallId?: string;
}
