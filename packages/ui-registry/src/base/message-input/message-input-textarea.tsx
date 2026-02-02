"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useMessageInputContext } from "./message-input-context";

/**
 * Render props for the Textarea component.
 */
export interface MessageInputTextareaRenderProps {
  /** Current input value */
  value: string;
  /** Update the input value */
  setValue: (value: string) => void;
  /** Handle form submission */
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  /** Whether the input is disabled */
  disabled: boolean;
  /** Placeholder text */
  placeholder: string;
  /** Reference to the editor */
  editorRef: React.RefObject<unknown>;
}

/**
 * Props for the MessageInput.Textarea component.
 */
export interface MessageInputTextareaProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Render prop for custom textarea implementation */
  children?:
    | React.ReactNode
    | ((props: MessageInputTextareaRenderProps) => React.ReactNode);
}

/**
 * Textarea component for entering message text.
 * Provides render props for custom editor implementations.
 */
export const MessageInputTextarea = React.forwardRef<
  HTMLDivElement,
  MessageInputTextareaProps
>(
  (
    { asChild, placeholder = "What do you want to do?", children, ...props },
    ref,
  ) => {
    const {
      value,
      setValue,
      handleSubmit,
      editorRef,
      isIdle,
      isUpdatingToken,
    } = useMessageInputContext();

    const disabled = !isIdle || isUpdatingToken;

    const renderProps: MessageInputTextareaRenderProps = {
      value,
      setValue,
      handleSubmit,
      disabled,
      placeholder,
      editorRef,
    };

    const Comp = asChild ? Slot : "div";

    return (
      <Comp
        ref={ref}
        data-slot="message-input-textarea"
        data-disabled={disabled || undefined}
        {...props}
      >
        {typeof children === "function" ? children(renderProps) : children}
      </Comp>
    );
  },
);
MessageInputTextarea.displayName = "MessageInput.Textarea";
