import { ThreadMessage } from "@tambo-ai-cloud/core";
import { AvailableComponent, AvailableComponents } from "./component-metadata";

export type InputContextCore = {
  messageHistory: ThreadMessage[];
  threadId: string;
};

export type InputContext = InputContextCore & {
  availableComponents: AvailableComponents;
  additionalContext?: string;
};

export type InputContextAsArray = {
  messageHistory: ThreadMessage[];
  availableComponents: AvailableComponent[];
  threadId: string;
};
