"use client";

import { useInteractablesResourceProvider } from "@/hooks/use-interactables-resource-provider";
import {
  MessageInputTextarea,
  type MessageInputTextareaProps,
  type ResourceProvider,
} from "@tambo-ai/ui-registry/components/message-input";

/**
 * MessageInputTextarea wrapper that automatically integrates with Tambo interactables.
 *
 * This is the apps/web-specific version that combines the generic MessageInputTextarea
 * with the interactables system. It's a drop-in replacement for MessageInputTextarea
 * that adds automatic @ mention support for registered components.
 *
 * **For apps/web developers:** Use this component instead of MessageInputTextarea
 * when you want automatic interactables integration.
 *
 * @example
 * ```tsx
 * import { MessageInput } from "@/components/ui/tambo/message-input";
 * import { MessageInputTextareaWithInteractables } from "@/components/ui/tambo/message-input-with-interactables";
 *
 * <MessageInput>
 *   <MessageInputTextareaWithInteractables />
 *   <MessageInput.Toolbar>
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 *
 * @example With external resource provider
 * ```tsx
 * const mcpResourceProvider: ResourceProvider = {
 *   search: async (query) => {
 *     // Fetch MCP resources...
 *     return mcpResources;
 *   }
 * };
 *
 * <MessageInput>
 *   <MessageInputTextareaWithInteractables
 *     resourceProvider={mcpResourceProvider}
 *   />
 * </MessageInput>
 * ```
 */
export const MessageInputTextareaWithInteractables = ({
  resourceProvider: externalResourceProvider,
  ...props
}: Omit<MessageInputTextareaProps, "onResourceSelect"> & {
  /** Optional external resource provider to merge with interactables */
  resourceProvider?: ResourceProvider;
}) => {
  const { resourceProvider, onResourceSelect } =
    useInteractablesResourceProvider(externalResourceProvider);

  return (
    <MessageInputTextarea
      resourceProvider={resourceProvider}
      onResourceSelect={onResourceSelect}
      {...props}
    />
  );
};

MessageInputTextareaWithInteractables.displayName =
  "MessageInputTextareaWithInteractables";
