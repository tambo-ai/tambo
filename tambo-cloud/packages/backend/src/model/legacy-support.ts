import {
  ComponentContextToolMetadata,
  ToolResponseBody,
} from "./component-metadata";

export interface ComponentContextTool<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Args extends unknown[] = any[],
  Response extends ToolResponseBody = ToolResponseBody,
> {
  getComponentContext: (...args: Args) => Promise<Response>;
  definition: ComponentContextToolMetadata;
}
