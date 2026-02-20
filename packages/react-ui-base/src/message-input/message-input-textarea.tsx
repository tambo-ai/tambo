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
export interface MessageInputTextareaRenderProps extends Record<
  string,
  unknown
> {
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
  "div",
  MessageInputTextareaRenderProps
>;

export interface MessageInputTextareaProps extends MessageInputTextareaComponentProps {
  /** Custom placeholder text */
  placeholder?: string;
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
  HTMLDivElement,
  MessageInputTextareaProps
>(
  (
    {
      placeholder = "What do you want to do?",
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
      isIdle,
      isUpdatingToken,
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

    const disabled = !isIdle || isUpdatingToken;

    const renderProps: MessageInputTextareaRenderProps = {
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

    return useRender({
      defaultTagName: "div",
      ref,
      render,
      state: renderProps,
      props: mergeProps(componentProps, {
        "data-slot": "message-input-textarea",
        "data-disabled": disabled || undefined,
      }),
    });
  },
);
MessageInputTextarea.displayName = "MessageInput.Textarea";
