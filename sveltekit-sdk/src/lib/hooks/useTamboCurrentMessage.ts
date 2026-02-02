import { getContext } from "svelte";
import { TAMBO_MESSAGE_KEY } from "../context.js";
import type { TamboThreadMessage } from "../types.js";
import type { TamboMessageContext } from "../providers/TamboMessageProvider.svelte";

/**
 * Get the current message from context.
 *
 * Must be called within a component that is a descendant of TamboMessageProvider.
 * @returns The current message or null
 * @throws Error if called outside of TamboMessageProvider
 */
export function useTamboCurrentMessage(): TamboThreadMessage | null {
  const context = getContext<TamboMessageContext | undefined>(
    TAMBO_MESSAGE_KEY,
  );

  if (!context) {
    throw new Error(
      "useTamboCurrentMessage must be used within a TamboMessageProvider",
    );
  }

  return context.message;
}

/**
 * Get the current component info from the message context.
 *
 * Must be called within a component that is a descendant of TamboMessageProvider.
 * @returns Object with component name and props, or null if not in a component message
 */
export function useTamboCurrentComponent(): {
  name: string | undefined;
  props: Record<string, unknown>;
} | null {
  const message = useTamboCurrentMessage();

  if (!message?.component) {
    return null;
  }

  return {
    name: message.component.name,
    props: message.component.props ?? {},
  };
}
