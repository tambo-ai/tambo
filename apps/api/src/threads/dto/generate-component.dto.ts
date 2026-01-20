import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  AvailableComponent,
  ComponentContextToolMetadata,
  type ComponentPropsMetadata,
} from "@tambo-ai-cloud/backend";
import { JSONSchema7 } from "json-schema";

@ApiSchema({ name: "AvailableComponent" })
export class AvailableComponentDto implements AvailableComponent {
  name!: string;
  description!: string;
  contextTools!: ComponentContextToolMetadataDto[];
  @ApiProperty({
    description: "JSON Schema for the component's props",
    type: "object",
    additionalProperties: true,
  })
  props!: ComponentPropsMetadata;
}

export class ToolParameters {
  name!: string;
  type!: string;
  description!: string;
  isRequired!: boolean;
  items?: { type: string };
  enumValues?: string[];
  schema?: JSONSchema7;
}

@ApiSchema({ name: "ComponentContextToolMetadata" })
export class ComponentContextToolMetadataDto implements ComponentContextToolMetadata {
  name!: string;
  description!: string;
  parameters!: ToolParameters[];

  @ApiProperty({
    required: false,
    type: Number,
    description:
      "Maximum number of times this tool can be called in a single thread execution.Overrides project-level maxToolCalls setting for this specific tool.",
  })
  maxCalls?: number;
}
