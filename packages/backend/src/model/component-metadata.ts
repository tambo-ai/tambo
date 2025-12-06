export type ComponentPropsMetadata = unknown;

import { type JSONSchema7 } from "json-schema";

export interface ComponentContextToolMetadata {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    isRequired: boolean;
    items?: { type: string };
    enumValues?: string[];
    schema?: JSONSchema7;
  }[];
  maxCalls?: number;
}

export interface AvailableComponent {
  name: string;
  description: string;
  props: ComponentPropsMetadata;
  contextTools: ComponentContextToolMetadata[];
}

export type AvailableComponents = Record<string, AvailableComponent>;

/**
 * The body of a tool response.
 * This is the data returned by the tool.
 * This is not the tool response, which is the entire message from the tool.
 */
export type ToolResponseBody = unknown;
