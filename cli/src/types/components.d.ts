/**
 * @file components.d.ts
 * @description Type declarations for UI components used in the CLI project.
 * These declarations are necessary to resolve TypeScript build errors when the components
 * are installed in user projects through the CLI.
 *
 * This file provides type definitions for:
 * - Message component
 * - ChatThread component
 * - ChatInput component
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
  }
  export const Message: React.ForwardRefExoticComponent<
    MessageProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/ui/chat-thread" {
  export interface ChatThreadProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ComponentVariant;
  }
  export const ChatThread: React.ForwardRefExoticComponent<
    ChatThreadProps & React.RefAttributes<HTMLDivElement>
  >;
}

declare module "@/components/ui/chat-input" {
  export interface ChatInputProps
    extends React.HTMLAttributes<HTMLFormElement> {
    variant?: ComponentVariant;
    contextKey?: string | null | undefined;
  }
  export const ChatInput: React.ForwardRefExoticComponent<
    ChatInputProps & React.RefAttributes<HTMLFormElement>
  >;
}
