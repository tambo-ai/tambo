/**
 * @file components.d.ts
 * @description Type declarations for UI components used in the CLI project.
 * These declarations are necessary to resolve TypeScript build errors when the components
 * are installed in user projects through the CLI.
 *
 * This file provides type definitions for:
 * - Message component
 * - ThreadContent component
 * - MessageInput component
 * - MessageSuggestions component
 * - ThreadHistory component
 * - ThreadList component
 * - MessageGenerationStage component
 * - Tooltip component
 * - ThreadDropdown component
 * - ScrollableMessageContainer component
 * - MessageInputFileButton component
 * - ElicitationUI component
 *
 * These components are meant to be installed and used in end-user projects
 * through the CLI installation process.
 */
type ComponentVariant = "default" | "solid" | "bordered" | null | undefined;

declare module "@/components/tambo/message" {
  import type { TamboThreadMessage } from "@tambo-ai/react";
  export interface MessageProps {
    className?: string;
    role: "user" | "assistant";
    content?: string | { type: string; text?: string }[];
    variant?: ComponentVariant;
    message: TamboThreadMessage;
    isLoading?: boolean;
    children?: React.ReactNode;
  }

  export interface MessageContentProps extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "content"
  > {
    content?: string | { type: string; text?: string }[];
  }

  export interface MessageRenderedComponentAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    enableCanvasSpace?: boolean;
  }

  export interface ToolcallInfoProps extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "content"
  > {
    /** Optional flag to render response content as Markdown. Default is true. */
    markdown?: boolean;
  }

  export const Message: React.ForwardRefExoticComponent<
    MessageProps & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageContent: React.ForwardRefExoticComponent<
    MessageContentProps & React.RefAttributes<HTMLDivElement>
  >;

  export const ToolcallInfo: React.ForwardRefExoticComponent<
    ToolcallInfoProps & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageRenderedComponentArea: React.ForwardRefExoticComponent<
    MessageRenderedComponentAreaProps & React.RefAttributes<HTMLDivElement>
  >;

  export const messageVariants: {
    (props?: {
      variant?: "default" | "solid";
      align?: "user" | "assistant";
    }): string;
    variants: Record<string, Record<string, string>>;
    defaultVariants: Record<string, string>;
  };

  export const ReasoningInfo: React.ForwardRefExoticComponent<
    ReasoningInfoProps & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageImages: React.ForwardRefExoticComponent<
    MessageImagesProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/tambo/thread-content" {
  export interface ThreadContentProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
    enableCanvasSpace?: boolean;
  }

  export interface ThreadContentRootProps extends React.HTMLAttributes<HTMLDivElement> {
    enableCanvasSpace?: boolean;
    variant?: ComponentVariant;
    children?: React.ReactNode;
  }

  export type ThreadContentMessagesProps = React.HTMLAttributes<HTMLDivElement>;

  export const ThreadContent: React.ForwardRefExoticComponent<
    ThreadContentProps & React.RefAttributes<HTMLDivElement>
  >;

  export const ThreadContentRoot: React.ForwardRefExoticComponent<
    ThreadContentRootProps & React.RefAttributes<HTMLDivElement>
  >;

  export const ThreadContentMessages: React.ForwardRefExoticComponent<
    ThreadContentMessagesProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/tambo/message-input" {
  export interface MessageInputProps extends React.HTMLAttributes<HTMLFormElement> {
    variant?: ComponentVariant;
    contextKey?: string;
  }
  export interface MessageInputMentionItem {
    id: string;
    name: string;
    icon?: React.ReactNode;
    componentData?: unknown;
  }

  export interface MessageInputRootProps extends React.HTMLAttributes<HTMLFormElement> {
    contextKey?: string;
    variant?: ComponentVariant;
    children?: React.ReactNode;
  }

  export interface MessageInputTextareaProps extends React.HTMLAttributes<HTMLDivElement> {
    placeholder?: string;
    staticMentionItems?: MessageInputMentionItem[];
    mentionItemFetcher?: (query: string) => Promise<MessageInputMentionItem[]>;
  }

  export interface MessageInputSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
  }

  export type MessageInputFileButtonProps =
    React.ButtonHTMLAttributes<HTMLButtonElement>;

  export type MessageInputMcpPromptButtonProps =
    React.ButtonHTMLAttributes<HTMLButtonElement>;

  export type MessageInputMcpResourceButtonProps =
    React.ButtonHTMLAttributes<HTMLButtonElement>;

  export type MessageInputStagedImagesProps =
    React.HTMLAttributes<HTMLDivElement>;

  export type MessageInputErrorProps =
    React.HTMLAttributes<HTMLParagraphElement>;

  export type MessageInputToolbarProps = React.HTMLAttributes<HTMLDivElement>;

  export type MessageInputMcpConfigButtonProps =
    React.HTMLAttributes<HTMLButtonElement>;

  export type MessageInputContextsProps = React.HTMLAttributes<HTMLDivElement>;

  export type MessageInputPlainTextareaProps =
    React.TextareaHTMLAttributes<HTMLTextAreaElement>;

  export const MessageInput: React.ForwardRefExoticComponent<
    MessageInputProps & React.RefAttributes<HTMLFormElement>
  >;

  export const MessageInputRoot: React.ForwardRefExoticComponent<
    MessageInputRootProps & React.RefAttributes<HTMLFormElement>
  >;

  export const MessageInputTextarea: React.ForwardRefExoticComponent<
    MessageInputTextareaProps & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageInputPlainTextarea: React.ForwardRefExoticComponent<
    MessageInputPlainTextareaProps & React.RefAttributes<HTMLTextAreaElement>
  >;

  export const MessageInputMcpConfigButton: React.ForwardRefExoticComponent<
    MessageInputMcpConfigButtonProps & React.RefAttributes<HTMLButtonElement>
  >;

  export const MessageInputSubmitButton: React.ForwardRefExoticComponent<
    MessageInputSubmitButtonProps & React.RefAttributes<HTMLButtonElement>
  >;

  export const MessageInputToolbar: React.ForwardRefExoticComponent<
    MessageInputToolbarProps & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageInputError: React.ForwardRefExoticComponent<
    MessageInputErrorProps & React.RefAttributes<HTMLParagraphElement>
  >;

  export const messageInputVariants: {
    (props?: { variant?: "default" | "solid" | "bordered" }): string;
    variants: Record<string, Record<string, string>>;
    defaultVariants: Record<string, string>;
  };

  export const MessageInputFileButton: React.ForwardRefExoticComponent<
    MessageInputFileButtonProps & React.RefAttributes<HTMLButtonElement>
  >;

  export const MessageInputMcpPromptButton: React.ForwardRefExoticComponent<
    MessageInputMcpPromptButtonProps & React.RefAttributes<HTMLButtonElement>
  >;

  export const MessageInputMcpResourceButton: React.ForwardRefExoticComponent<
    MessageInputMcpResourceButtonProps & React.RefAttributes<HTMLButtonElement>
  >;

  export const MessageInputStagedImages: React.ForwardRefExoticComponent<
    MessageInputStagedImagesProps & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageInputContexts: React.ForwardRefExoticComponent<
    MessageInputContextsProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/tambo/message-input/text-editor" {
  import type { Editor } from "@tiptap/react";

  export interface ResourceItem {
    id: string;
    name: string;
    icon?: React.ReactNode;
    componentData?: unknown;
  }

  export interface CommandConfig {
    triggerChar: string;
    items:
      | ResourceItem[]
      | ((query: string) => Promise<ResourceItem[]>)
      | {
          staticItems?: ResourceItem[];
          fetchItems?: (query: string) => Promise<ResourceItem[]>;
        };
    onSelect?: (item: ResourceItem) => void;
    renderLabel: (props: {
      options: unknown;
      node: { attrs: Record<string, unknown> };
      suggestion: unknown;
    }) => string;
    HTMLAttributes?: Record<string, string>;
    isMenuOpenRef?: React.MutableRefObject<boolean>;
  }

  export interface TextEditorProps {
    value: string;
    onChange: (text: string) => void;
    onKeyDown?: (event: React.KeyboardEvent, editor: Editor) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    editorRef?: React.MutableRefObject<Editor | null>;
    commands?: CommandConfig[];
    onSubmit?: (e: React.FormEvent) => Promise<void>;
    staticMentionItems?: ResourceItem[];
    mentionItemFetcher?: (query: string) => Promise<ResourceItem[]>;
  }

  export const TextEditor: React.ForwardRefExoticComponent<
    TextEditorProps & React.RefAttributes<HTMLDivElement>
  >;

  export function hasExistingMention(editor: Editor, label: string): boolean;
}

declare module "@/components/tambo/message-suggestions" {
  import type { Suggestion } from "@tambo-ai/react";

  export interface MessageSuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
    maxSuggestions?: number;
    initialSuggestions?: Suggestion[];
  }

  export interface MessageSuggestionsRootProps extends React.HTMLAttributes<HTMLDivElement> {
    maxSuggestions?: number;
    initialSuggestions?: Suggestion[];
    children?: React.ReactNode;
  }

  export type MessageSuggestionsStatusProps =
    React.HTMLAttributes<HTMLDivElement>;

  export type MessageSuggestionsListProps =
    React.HTMLAttributes<HTMLDivElement>;

  export const MessageSuggestions: React.ForwardRefExoticComponent<
    MessageSuggestionsProps & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageSuggestionsRoot: React.ForwardRefExoticComponent<
    MessageSuggestionsRootProps & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageSuggestionsStatus: React.ForwardRefExoticComponent<
    MessageSuggestionsStatusProps & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageSuggestionsList: React.ForwardRefExoticComponent<
    MessageSuggestionsListProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/tambo/markdown-components" {
  export const createMarkdownComponents: (
    theme?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Record<string, React.ComponentType<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const markdownComponents: Record<string, React.ComponentType<any>>;
}

declare module "@/components/tambo/thread-history" {
  export interface ThreadHistoryProps extends React.HTMLAttributes<HTMLDivElement> {
    contextKey?: string;
    onThreadChange?: () => void;
    defaultCollapsed?: boolean;
    position?: "left" | "right";
  }

  export interface ThreadHistoryRootProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }

  export type ThreadHistoryHeaderProps = React.HTMLAttributes<HTMLDivElement>;

  export type ThreadHistoryNewButtonProps =
    React.ButtonHTMLAttributes<HTMLButtonElement>;

  export type ThreadHistorySearchProps =
    React.InputHTMLAttributes<HTMLInputElement>;

  export type ThreadHistoryListProps = React.HTMLAttributes<HTMLDivElement>;

  export const ThreadHistory: React.ForwardRefExoticComponent<
    ThreadHistoryProps & React.RefAttributes<HTMLDivElement>
  >;

  export const ThreadHistoryRoot: React.ForwardRefExoticComponent<
    ThreadHistoryRootProps & React.RefAttributes<HTMLDivElement>
  >;

  export const ThreadHistoryHeader: React.ForwardRefExoticComponent<
    ThreadHistoryHeaderProps & React.RefAttributes<HTMLDivElement>
  >;

  export const ThreadHistoryNewButton: React.ForwardRefExoticComponent<
    ThreadHistoryNewButtonProps & React.RefAttributes<HTMLButtonElement>
  >;

  export const ThreadHistorySearch: React.ForwardRefExoticComponent<
    ThreadHistorySearchProps & React.RefAttributes<HTMLInputElement>
  >;

  export const ThreadHistoryList: React.ForwardRefExoticComponent<
    ThreadHistoryListProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/tambo/thread-list" {
  export interface ThreadListProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
    threads: TamboThread[];
    selectedThreadId?: string | null;
    onThreadSelect?: (threadId: string) => void;
    isLoading?: boolean;
    size?: "default" | "compact" | "relaxed";
  }
  export const ThreadList: React.ForwardRefExoticComponent<
    ThreadListProps & React.RefAttributes<HTMLDivElement>
  >;
  export const threadListVariants: {
    (props?: {
      variant?: "default" | "solid" | "bordered";
      size?: "default" | "compact" | "relaxed";
    }): string;
    variants: Record<string, Record<string, string>>;
    defaultVariants: Record<string, string>;
  };
}

declare module "@/components/tambo/message-generation-stage" {
  export interface GenerationStageProps extends React.HTMLAttributes<HTMLDivElement> {
    showLabel?: boolean;
  }
  export const MessageGenerationStage: React.ForwardRefExoticComponent<
    GenerationStageProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/tambo/suggestions-tooltip" {
  export interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    delayDuration?: number;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    className?: string;
  }

  export type TooltipProviderProps = React.ComponentPropsWithoutRef<
    typeof Provider
  >;

  export const Tooltip: React.FC<TooltipProps>;
  export const TooltipProvider: React.FC<TooltipProviderProps>;
  export const TooltipContent: React.ForwardRefExoticComponent<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.ComponentPropsWithoutRef<any> & React.RefAttributes<any>
  >;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const TooltipRoot: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const TooltipTrigger: any;
}

declare module "@/components/tambo/thread-dropdown" {
  export interface ThreadDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
    contextKey?: string | undefined;
    onThreadChange?: () => void;
  }
  export const ThreadDropdown: React.ForwardRefExoticComponent<
    ThreadDropdownProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/tambo/scrollable-message-container" {
  export const ScrollableMessageContainer: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/tambo/elicitation-ui" {
  import type {
    TamboElicitationRequest,
    TamboElicitationResponse,
  } from "@tambo-ai/react/mcp";

  export interface ElicitationUIProps {
    request: TamboElicitationRequest;
    onResponse: (response: TamboElicitationResponse) => void;
    className?: string;
  }

  export const ElicitationUI: React.FC<ElicitationUIProps>;
}

declare module "@/components/tambo/mcp-components" {
  export interface McpPromptButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onInsertText: (text: string) => void;
    value: string;
    className?: string;
  }

  export interface McpResourceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onInsertResource: (id: string, label: string) => void;
    value: string;
    className?: string;
  }

  export const McpPromptButton: React.ForwardRefExoticComponent<
    McpPromptButtonProps & React.RefAttributes<HTMLButtonElement>
  >;

  export const McpResourceButton: React.ForwardRefExoticComponent<
    McpResourceButtonProps & React.RefAttributes<HTMLButtonElement>
  >;
}

declare module "@/lib/thread-hooks" {
  import type { TamboThreadMessage } from "@tambo-ai/react";

  export function useMergeRefs<Instance>(
    ...refs: (React.Ref<Instance> | undefined)[]
  ): null | React.RefCallback<Instance>;

  export function useCanvasDetection(ref: React.RefObject<HTMLElement>): {
    hasCanvasSpace: boolean;
    canvasIsOnLeft: boolean;
  };

  export function usePositioning(
    className: string | undefined,
    canvasIsOnLeft: boolean,
    hasCanvasSpace: boolean,
  ): {
    isLeftPanel: boolean;
    historyPosition: "left" | "right";
  };

  export function getSafeContent(
    content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
  ): string | React.ReactElement;

  export function checkHasContent(
    content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
  ): boolean;

  export function getMessageImages(
    content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
  ): string[];
}

declare module "@/components/tambo/thread-container" {
  export interface ThreadContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    disableSidebarSpacing?: boolean;
  }

  export const ThreadContainer: React.ForwardRefExoticComponent<
    ThreadContainerProps & React.RefAttributes<HTMLDivElement>
  >;

  export function useThreadContainerContext(): {
    containerRef: React.RefObject<HTMLDivElement>;
    hasCanvasSpace: boolean;
    canvasIsOnLeft: boolean;
    isLeftPanel: boolean;
    historyPosition: "left" | "right";
  };
}

declare module "@/components/tambo/mcp-config-modal" {
  export const McpConfigModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
  }>;

  export type McpServer = string | { url: string };
  export function useMcpServers(): McpServer[];
}
