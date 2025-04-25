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
 *
 * These components are meant to be installed and used in end-user projects
 * through the CLI installation process.
 */
type ComponentVariant = "default" | "solid" | "bordered" | null | undefined;

declare module "@/components/ui/message" {
  export interface MessageProps {
    className?: string;
    role: "user" | "assistant";
    content: string | { type: string; text?: string }[];
    variant?: ComponentVariant;
    message: TamboThreadMessage;
    isLoading?: boolean;
    enableCanvasSpace?: boolean;
  }

  export interface MessageRootProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
    role: "user" | "assistant";
    message: TamboThreadMessage;
    variant?: any;
    isLoading?: boolean;
    children: React.ReactNode;
  }

  export interface MessageBubbleProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
    content?: string | { type: string; text?: string }[];
  }

  export interface MessageRenderedComponentAreaProps
    extends React.HTMLAttributes<HTMLDivElement> {
    enableCanvasSpace?: boolean;
  }

  export const Message: React.ForwardRefExoticComponent<
    MessageProps & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageRoot: React.ForwardRefExoticComponent<
    MessageRootProps & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageBubble: React.ForwardRefExoticComponent<
    MessageBubbleProps & React.RefAttributes<HTMLDivElement>
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
}

declare module "@/components/ui/thread-content" {
  export interface ThreadContentProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
    enableCanvasSpace?: boolean;
  }

  export interface ThreadContentRootProps
    extends React.HTMLAttributes<HTMLDivElement> {
    enableCanvasSpace?: boolean;
    variant?: any;
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

declare module "@/components/ui/message-input" {
  export interface MessageInputProps
    extends React.HTMLAttributes<HTMLFormElement> {
    variant?: ComponentVariant;
    contextKey: string | undefined;
  }

  export interface MessageInputRootProps
    extends React.HTMLAttributes<HTMLFormElement> {
    contextKey?: string;
    variant?: any;
    children?: React.ReactNode;
  }

  export interface MessageInputTextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    placeholder?: string;
  }

  export interface MessageInputSubmitButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
  }

  export type MessageInputErrorProps =
    React.HTMLAttributes<HTMLParagraphElement>;

  export const MessageInput: React.ForwardRefExoticComponent<
    MessageInputProps & React.RefAttributes<HTMLTextAreaElement>
  >;

  export const MessageInputRoot: React.ForwardRefExoticComponent<
    MessageInputRootProps & React.RefAttributes<HTMLFormElement>
  >;

  export const MessageInputTextarea: React.ForwardRefExoticComponent<
    MessageInputTextareaProps & React.RefAttributes<HTMLTextAreaElement>
  >;

  export const MessageInputSubmitButton: React.ForwardRefExoticComponent<
    MessageInputSubmitButtonProps & React.RefAttributes<HTMLButtonElement>
  >;

  export const MessageInputToolbar: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;

  export const MessageInputError: React.ForwardRefExoticComponent<
    MessageInputErrorProps & React.RefAttributes<HTMLParagraphElement>
  >;

  export const messageInputVariants: {
    (props?: { variant?: "default" | "solid" | "bordered" }): string;
    variants: Record<string, Record<string, string>>;
    defaultVariants: Record<string, string>;
  };
}

declare module "@/components/ui/message-suggestions" {
  export interface MessageSuggestionsProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
    maxSuggestions?: number;
  }

  export interface MessageSuggestionsRootProps
    extends React.HTMLAttributes<HTMLDivElement> {
    maxSuggestions?: number;
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

declare module "@/components/ui/markdownComponents" {
  export const createMarkdownComponents: (
    theme?: string,
  ) => Record<string, React.ComponentType<any>>;
}

declare module "@/components/ui/thread-history" {
  export interface ThreadHistoryProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
    contextKey?: string | undefined;
    onThreadChange?: () => void;
  }
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

declare module "@/components/ui/thread-list" {
  export interface ThreadListProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
    threads: any[];
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

declare module "@/components/ui/message-generation-stage" {
  export interface GenerationStageProps
    extends React.HTMLAttributes<HTMLDivElement> {
    showLabel?: boolean;
  }
  export const MessageGenerationStage: React.ForwardRefExoticComponent<
    GenerationStageProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/ui/tooltip" {
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
    React.ComponentPropsWithoutRef<any> & React.RefAttributes<any>
  >;
  export const TooltipRoot: any;
  export const TooltipTrigger: any;
}
