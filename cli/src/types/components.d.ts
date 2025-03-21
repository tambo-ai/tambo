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
 *
 * These components are meant to be installed and used in end-user projects
 * through the CLI installation process.
 */
type ComponentVariant = "default" | "solid" | "bordered" | null | undefined;

declare module "@/components/ui/message" {
  export interface MessageProps {
    role: "user" | "assistant";
    content: string | { type: string; text?: string }[];
    variant?: ComponentVariant;
    message: TamboThreadMessage;
    isLoading?: boolean;
  }
  export const Message: React.ForwardRefExoticComponent<
    MessageProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/ui/thread-content" {
  export interface ThreadContentProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
  }
  export const ThreadContent: React.ForwardRefExoticComponent<
    ThreadContentProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/ui/message-input" {
  export interface MessageInputProps
    extends React.HTMLAttributes<HTMLFormElement> {
    variant?: ComponentVariant;
    contextKey: string | undefined;
  }
  export const MessageInput: React.ForwardRefExoticComponent<
    MessageInputProps & React.RefAttributes<HTMLFormElement>
  >;
}

declare module "@/components/ui/message-suggestions" {
  export interface MessageSuggestionsProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
  }
  export const MessageSuggestions: React.ForwardRefExoticComponent<
    MessageSuggestionsProps & React.RefAttributes<HTMLDivElement>
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
    contextKey: string | undefined;
    onThreadChange?: (threadId: string) => void;
  }
  export const ThreadHistory: React.ForwardRefExoticComponent<
    ThreadHistoryProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/ui/thread-list" {
  export interface ThreadListProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
  }
  export const ThreadList: React.ForwardRefExoticComponent<
    ThreadListProps & React.RefAttributes<HTMLDivElement>
  >;
}
