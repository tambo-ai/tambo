import { ApiProperty, ApiSchema, getSchemaPath } from '@nestjs/swagger';
import {
  AvailableComponent,
  AvailableComponents,
  ComponentContextToolMetadata,
  ComponentPropsMetadata,
} from '@use-hydra-ai/hydra-ai-server';
import { MinLength } from 'class-validator';
import { JSONSchema7 } from 'json-schema';
import { ChatCompletionContentPartDto } from '../../threads/dto/message.dto';
import { LegacyChatMessageDto } from './legacy-chat-history.dto';

@ApiSchema({ name: 'ComponentPropsMetadata' })
export class ComponentPropsMetadataDto implements ComponentPropsMetadata {}

@ApiSchema({ name: 'AvailableComponent' })
export class AvailableComponentDto implements AvailableComponent {
  name!: string;
  description!: string;
  contextTools!: ComponentContextToolMetadataDto[];
  props!: ComponentPropsMetadataDto;
}

@ApiSchema({ name: 'AvailableComponents' })
export class AvailableComponentsDto implements AvailableComponents {
  [key: string]: AvailableComponentDto;
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

@ApiSchema({ name: 'ComponentContextToolMetadata' })
export class ComponentContextToolMetadataDto
  implements ComponentContextToolMetadata
{
  name!: string;
  description!: string;
  parameters!: ToolParameters[];
}

export class GenerateComponentRequest {
  messageHistory!: LegacyChatMessageDto[];
  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(AvailableComponentDto) },
  })
  availableComponents!: any;
  /** Optional threadId to generate a component for */
  threadId?: string;
  /** Optional contextKey to generate a component for */
  contextKey?: string;
}
export class GenerateComponentRequest2 {
  /**
   * The message to generate a component for. The entire thread history will be
   * pulled from the database.
   *
   * This is the same as ThreadMessage.content */
  @MinLength(1)
  content!: ChatCompletionContentPartDto[];
  availableComponents!: AvailableComponentDto[];
  /** Optional threadId to generate a component for */
  threadId?: string;
  /** Optional contextKey to generate a component for */
  contextKey?: string;
}
