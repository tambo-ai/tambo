"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import {
  useMessageInputContext,
  type PromptItem,
  type PromptProvider,
  type ResourceItem,
  type ResourceProvider,
  type StagedImage,
  type TamboEditor,
} from "./message-input-context";
import {
  useCombinedPromptList,
  useCombinedResourceList,
  type PromptFormatOptions,
  type ResourceFormatOptions,
} from "./use-combined-lists";

/**
 * Render props for the Textarea component.
 */
export interface MessageInputTextareaState extends Record<string, unknown> {
  slot: string;
  /** Current input value */
  value: string;
  /** Update the input value */
  setValue: (value: string) => void;
  /** Submit the current message without requiring a DOM event */
  submitMessage: () => Promise<void>;
  /** Handle form submission (thin wrapper around submitMessage) */
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  /** Whether the input is disabled */
  disabled: boolean;
  /** Placeholder text */
  placeholder: string;
  /** Reference to the editor */
  editorRef: React.RefObject<TamboEditor | null>;
  /** Add a single image to the staged list */
  addImage: (file: File) => Promise<void>;
  /** Currently staged images */
  images: StagedImage[];
  /** Set image error message */
  setImageError: (error: string | null) => void;
  /** Combined resource items (MCP + external provider) */
  resourceItems: ResourceItem[];
  /** Callback to update resource search query */
  setResourceSearch: (query: string) => void;
  /** Combined prompt items (MCP + external provider) */
  promptItems: PromptItem[];
  /** Callback to update prompt search query */
  setPromptSearch: (query: string) => void;
}

/**
 * Props for the MessageInput.Textarea component.
 */
type MessageInputTextareaComponentProps = useRender.ComponentProps<
  "textarea",
  MessageInputTextareaState
>;

export interface MessageInputTextareaProps extends MessageInputTextareaComponentProps {
  /** Custom placeholder text */
  placeholder?: string;
  /** Whether pressing Enter submits the message or inserts a newline. Defaults to "newline". */
  enterKeyBehaviour?: "newline" | "submit";
  /** Disables Cmd/Ctrl+Enter submit shortcut in "newline" mode. Defaults to false. */
  disableModifierSubmit?: boolean;
  /** Resource provider for @ mentions (optional - MCP resources included by default) */
  resourceProvider?: ResourceProvider;
  /** Prompt provider for / commands (optional - MCP prompts included by default) */
  promptProvider?: PromptProvider;
  /** Options for formatting MCP resources into ResourceItems */
  resourceFormatOptions?: ResourceFormatOptions;
  /** Options for formatting MCP prompts into PromptItems */
  promptFormatOptions?: PromptFormatOptions;
}

/**
 * Textarea component for entering message text.
 * Provides render props for custom editor implementations.
 * Handles MCP resource/prompt integration internally.
 */
export const MessageInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  MessageInputTextareaProps
>(
  (
    {
      placeholder = "What do you want to do?",
      enterKeyBehaviour = "newline",
      disableModifierSubmit = false,
      resourceProvider,
      promptProvider,
      resourceFormatOptions,
      promptFormatOptions,
      ...props
    },
    ref,
  ) => {
    const {
      value,
      setValue,
      submitMessage,
      handleSubmit,
      editorRef,
      addImage,
      images,
      setImageError,
    } = useMessageInputContext();

    // Track search state for resources (controlled by TextEditor)
    const [resourceSearch, setResourceSearch] = React.useState("");

    // Track search state for prompts (controlled by TextEditor)
    const [promptSearch, setPromptSearch] = React.useState("");

    // Get combined resource list (MCP + external provider), filtered by search
    const resourceItems = useCombinedResourceList(
      resourceProvider,
      resourceSearch,
      resourceFormatOptions,
    );

    // Get combined prompt list (MCP + external provider), filtered by search
    const promptItems = useCombinedPromptList(
      promptProvider,
      promptSearch,
      promptFormatOptions,
    );

    // Keep typing enabled while generation is active or auth token is updating.
    // Submission state is controlled by submit/stop controls and root guards.
    const disabled = false;

    const renderProps: MessageInputTextareaState = {
      slot: "message-input-textarea",
      value,
      setValue,
      submitMessage,
      handleSubmit,
      disabled,
      placeholder,
      editorRef,
      addImage,
      images,
      setImageError,
      resourceItems,
      setResourceSearch,
      promptItems,
      setPromptSearch,
    };

    const { render, ...componentProps } = props;

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
      },
      [setValue],
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== "Enter") return;

        const hasModifier = e.metaKey || e.ctrlKey;

        if (enterKeyBehaviour === "submit") {
          // Enter (no modifier) submits; Shift+Enter is always a newline
          if (!e.shiftKey && !hasModifier) {
            e.preventDefault();
            void submitMessage();
          }
        } else {
          // "newline" mode: Cmd/Ctrl+Enter submits (unless disabled)
          if (hasModifier && !disableModifierSubmit) {
            e.preventDefault();
            void submitMessage();
          }
        }
      },
      [enterKeyBehaviour, disableModifierSubmit, submitMessage],
    );

    return useRender({
      defaultTagName: "textarea",
      ref,
      render,
      state: renderProps,
      props: mergeProps(componentProps, {
        value,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        placeholder,
        disabled,
        "data-disabled": disabled || undefined,
      }),
    });
  },
);
MessageInputTextarea.displayName = "MessageInput.Textarea";
