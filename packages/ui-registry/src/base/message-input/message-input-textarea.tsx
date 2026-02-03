"use client";

import { Slot } from "@radix-ui/react-slot";
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
export interface MessageInputTextareaProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
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
  /** Render prop for custom textarea implementation */
  children?:
    | React.ReactNode
    | ((props: MessageInputTextareaRenderProps) => React.ReactNode);
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
      asChild,
      placeholder = "What do you want to do?",
      resourceProvider,
      promptProvider,
      resourceFormatOptions,
      promptFormatOptions,
      children,
      ...props
    },
    ref,
  ) => {
    const {
      value,
      setValue,
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
