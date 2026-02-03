"use client";

import * as React from "react";
import { useMessageInputContext, type TamboEditor } from "./message-input-context";

/**
 * Render props for the ValueAccess component.
 */
export interface MessageInputValueAccessRenderProps {
  /** Current input value */
  value: string;
  /** Update the input value */
  setValue: (value: string) => void;
  /** Reference to the TamboEditor instance */
  editorRef: React.RefObject<TamboEditor | null>;
}

/**
 * Props for the MessageInput.ValueAccess component.
 */
export interface MessageInputValueAccessProps {
  /** Render function receiving value access props */
  children: (props: MessageInputValueAccessRenderProps) => React.ReactNode;
}

/**
 * Headless component that provides access to the current input value and editor.
 * Use this when you need to read or modify the input value without rendering
 * a specific input element (e.g., for toolbar buttons that insert text).
 *
 * This component does not render any DOM elements - it only provides render props.
 *
 * @example
 * ```tsx
 * <MessageInput.ValueAccess>
 *   {({ value, setValue }) => (
 *     <button onClick={() => setValue(value + " appended text")}>
 *       Append Text
 *     </button>
 *   )}
 * </MessageInput.ValueAccess>
 * ```
 */
export const MessageInputValueAccess: React.FC<MessageInputValueAccessProps> = ({
  children,
}) => {
  const { value, setValue, editorRef } = useMessageInputContext();

  return <>{children({ value, setValue, editorRef })}</>;
};
MessageInputValueAccess.displayName = "MessageInput.ValueAccess";
