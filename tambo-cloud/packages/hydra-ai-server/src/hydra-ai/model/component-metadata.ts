import { type JSONSchema7 } from "json-schema";
import { ComponentPropsMetadata } from "./component-props-metadata";

export interface ComponentMetadata {
  name: string;
  description: string;
  props: ComponentPropsMetadata;
}

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
}

export interface ComponentContextTool<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Args extends unknown[] = any[],
  Response extends ToolResponseBody = ToolResponseBody,
> {
  getComponentContext: (...args: Args) => Promise<Response>;
  definition: ComponentContextToolMetadata;
}

export interface AvailableComponent extends ComponentMetadata {
  contextTools: ComponentContextToolMetadata[];
}

export interface ComponentWithContext extends ComponentMetadata {
  context: ToolResponseBody;
}

export interface AvailableComponents {
  [key: string]: AvailableComponent;
}

/**
 * The body of a tool response.
 * This is the data returned by the tool.
 * This is not the tool response, which is the entire message from the tool.
 */
export type ToolResponseBody = unknown;
