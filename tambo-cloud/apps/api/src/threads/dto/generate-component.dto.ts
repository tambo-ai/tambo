import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  AvailableComponent,
  ComponentContextToolMetadata,
  ComponentPropsMetadata,
} from "@tambo-ai-cloud/backend";
import { JSONSchema7 } from "json-schema";

@ApiSchema({ name: "ComponentPropsMetadata" })
export class ComponentPropsMetadataDto implements ComponentPropsMetadata {}

@ApiSchema({ name: "AvailableComponent" })
export class AvailableComponentDto implements AvailableComponent {
  name!: string;
  description!: string;
  contextTools!: ComponentContextToolMetadataDto[];
  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  props!: ComponentPropsMetadataDto;
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
export class ComponentContextToolMetadataDto
  implements ComponentContextToolMetadata
{
  name!: string;
  description!: string;
  parameters!: ToolParameters[];
}
