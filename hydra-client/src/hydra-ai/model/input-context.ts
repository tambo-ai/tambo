import { ChatMessage } from "./chat-message";
import { AvailableComponents } from "./component-metadata";

export type InputContext = {
  messageHistory: ChatMessage[];
  availableComponents: AvailableComponents;
};
