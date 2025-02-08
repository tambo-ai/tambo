import {
  AvailableComponent as AvailableComponentInterface,
  AvailableComponents as AvailableComponentsInterface,
  ComponentContextToolMetadata as ComponentContextToolMetadataInterface,
  ComponentPropsMetadata as ComponentPropsMetadataInterface,
} from '@use-hydra-ai/hydra-ai-server';
import { JSONSchema7 } from 'json-schema';
import { ComponentParameter } from './component-decision.dto';
import { LegacyChatMessage } from './legacy-chat-history.dto';

export class ComponentPropsMetadata
  implements ComponentPropsMetadataInterface {}
export class AvailableComponent implements AvailableComponentInterface {
  name!: string;
  description!: string;
  parameters!: ComponentParameter[];
  contextTools!: ComponentContextToolMetadata[];
  props!: ComponentPropsMetadata;
}

export class AvailableComponents implements AvailableComponentsInterface {
  [key: string]: AvailableComponent;
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
export class ComponentContextToolMetadata
  implements ComponentContextToolMetadataInterface
{
  name!: string;
  description!: string;
  parameters!: ToolParameters[];
}

export class GenerateComponentRequest {
  messageHistory!: LegacyChatMessage[];
  availableComponents!: AvailableComponents;
  /** Optional threadId to generate a component for */
  threadId?: string;
  /** Optional contextKey to generate a component for */
  contextKey?: string;
}
