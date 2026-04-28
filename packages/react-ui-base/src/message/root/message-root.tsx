import { useRender, UseRenderComponentProps } from "@base-ui/react/use-render";
import { useTambo, type ReactTamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import {
  hasComponentContent,
  hasResourceContent,
  hasTextContent,
  hasToolResultContent,
  hasToolUseContent,
} from "../../utils/content-type-guards";
import {
  stateBooleanMapping,
  stateStringMapping,
} from "../../utils/state-mapping";
import { MessageRootContext } from "./message-root-context";

export type MessageRootComponentProps = (
  | {
      /** The full Tambo thread message object to provide context for child components. */
      message: ReactTamboThreadMessage;
    }
  | {
      /** The ID of the message to use */
      id: string;
    }
) &
  React.PropsWithChildren<{
    /** Optional flag to indicate if the message is in a loading state. */
    isLoading?: boolean;
  }>;

export type MessageRootState = {
  /** Unique identifier for the message, used for data attributes and tracking.*/
  id: string;
  /** The slot name for this component, used for data attributes. */
  slot: string;
  /** The role of the message sender ('user' or 'assistant'). */
  role: "user" | "assistant";
  /** Optional flag to indicate if the message is in a loading state. */
  isLoading: boolean;
  /** The full Tambo thread message object. */
  message: ReactTamboThreadMessage;
  /** Whether the message is currently in a reasoning state. */
  reasoning: boolean;
  /** Time in milliseconds spent in reasoning state, or null if not applicable. */
  reasoningMs: number | null;
  /** Whether the message has text/markdown content. */
  hasText: boolean;
  /** Whether the message has a tool call. */
  hasToolUse: boolean;
  /** Whether the message has a tool result. */
  hasToolResult: boolean;
  /** Whether the message has a component. */
  hasComponent: boolean;
  /** Whether the message has a resource. */
  hasResource: boolean;
};

export { type UseRenderComponentProps } from "@base-ui/react/use-render";

export type MessageRootProps = UseRenderComponentProps<
  "div",
  MessageRootState
> &
  MessageRootComponentProps;

/**
 * Root primitive for a message component.
 * Provides context for child components and applies data attributes.
 * Renders nothing for tool response messages.
 */
export const MessageRoot: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MessageRootProps> & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, MessageRootProps>(
  function MessageRoot(props, ref) {
    const { messages, isIdle } = useTambo();
    const message = React.useMemo(() => {
      if ("message" in props) {
        return props.message;
      }
      if ("id" in props) {
        return messages.find((msg) => msg.id === props.id);
      }
      return undefined;
    }, [props, messages]);

    const { render, isLoading, ...componentProps } = props;
    const contentFlags = React.useMemo(() => {
      const flags = {
        hasText: hasTextContent(message?.content),
        hasToolUse: hasToolUseContent(message?.content),
        hasToolResult: hasToolResultContent(message?.content),
        hasComponent: hasComponentContent(message?.content),
        hasResource: hasResourceContent(message?.content),
      };
      const hasContent = Object.values(flags).some(Boolean);
      return { ...flags, hasContent };
    }, [message?.content]);

    const state: MessageRootState = {
      id: message?.id ?? "unknown",
      slot: "message-root" as const,
      role: message?.role === "assistant" ? "assistant" : "user",
      isLoading: isLoading ?? !isIdle,
      message: message as ReactTamboThreadMessage,
      reasoning: Boolean(message?.reasoning),
      reasoningMs: message?.reasoningDurationMS ?? null,
      ...contentFlags,
    };
    const element = useRender({
      defaultTagName: "div",
      ref,
      render,
      state,
      stateAttributesMapping: {
        message: () => null,
        hasText: stateBooleanMapping("hasText"),
        hasToolUse: stateBooleanMapping("hasToolUse"),
        hasToolResult: stateBooleanMapping("hasToolResult"),
        hasComponent: stateBooleanMapping("hasComponent"),
        hasResource: stateBooleanMapping("hasResource"),
        reasoning: stateBooleanMapping("reasoning"),
        reasoningMs: stateStringMapping("reasoningMs"),
      },
      props: componentProps,
    });

    return (
      <MessageRootContext.Provider value={state}>
        {element}
      </MessageRootContext.Provider>
    );
  },
);
