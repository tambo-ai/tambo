import { ThreadMessage } from "@use-hydra-ai/core";
import { ChatMessage } from "./chat-message";
import { AvailableComponent, AvailableComponents } from "./component-metadata";

export type InputContextCore = {
  messageHistory: ChatMessage[];
  threadId: string;
};

export type InputContext = InputContextCore & {
  availableComponents: AvailableComponents;
};

export type InputContextAsArray = {
  messageHistory: ThreadMessage[];
  availableComponents: AvailableComponent[];
  threadId: string;
};
