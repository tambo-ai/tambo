"use client";

import { MessageSuggestionsGenerationStage } from "./generation-stage/message-suggestions-generation-stage";
import { MessageSuggestionsItem } from "./item/message-suggestions-item";
import { MessageSuggestionsList } from "./list/message-suggestions-list";
import { MessageSuggestionsRoot } from "./root/message-suggestions-root";
import { MessageSuggestionsStatus } from "./status/message-suggestions-status";

/**
 * MessageSuggestions namespace containing all message suggestions base components.
 */
const MessageSuggestions = {
  Root: MessageSuggestionsRoot,
  Status: MessageSuggestionsStatus,
  GenerationStage: MessageSuggestionsGenerationStage,
  List: MessageSuggestionsList,
  Item: MessageSuggestionsItem,
};

export type {
  MessageSuggestionsGenerationStageProps,
  MessageSuggestionsGenerationStageRenderProps,
} from "./generation-stage/message-suggestions-generation-stage";
export type { MessageSuggestionsItemProps } from "./item/message-suggestions-item";
export type {
  MessageSuggestionsListProps,
  MessageSuggestionsListRenderProps,
} from "./list/message-suggestions-list";
export type { MessageSuggestionsContextValue } from "./root/message-suggestions-context";
export type { MessageSuggestionsRootProps } from "./root/message-suggestions-root";
export type { MessageSuggestionsStatusProps } from "./status/message-suggestions-status";

export {
  useMessageSuggestionsContext,
  useOptionalMessageSuggestionsContext,
} from "./root/message-suggestions-context";

export { MessageSuggestions };
