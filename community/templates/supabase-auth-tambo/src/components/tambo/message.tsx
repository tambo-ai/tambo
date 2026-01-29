"use client";

import { cn } from "@/lib/utils";
import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  role: "user" | "assistant";
  message: TamboThreadMessage;
}

export const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ role, message, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full",
          role === "assistant" ? "justify-start" : "justify-end",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "flex flex-col gap-2 max-w-full",
            role === "assistant" ? "w-full max-w-3xl" : "max-w-xl",
          )}
        >
          <MessageContent message={message} role={role} />
          {message.renderedComponent && (
            <MessageRenderedComponentArea
              component={message.renderedComponent}
            />
          )}
        </div>
      </div>
    );
  },
);

Message.displayName = "Message";

interface MessageContentProps {
  message: TamboThreadMessage;
  role: "user" | "assistant";
  className?: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  message,
  role,
  className,
}) => {
  const content = React.useMemo(() => {
    if (Array.isArray(message.content)) {
      return message.content
        .map((part) => (part.type === "text" && part.text ? part.text : ""))
        .join("");
    }
    return typeof message.content === "string" ? message.content : "";
  }, [message.content]);

  // Don't render empty content or empty object strings
  if (!content || content.trim() === "{}" || content.trim() === "") return null;

  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words",
        role === "user"
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground border border-border",
        className,
      )}
    >
      {content}
    </div>
  );
};

interface MessageRenderedComponentAreaProps {
  component: React.ReactNode;
  className?: string;
}

export const MessageRenderedComponentArea: React.FC<
  MessageRenderedComponentAreaProps
> = ({ component, className }) => {
  return (
    <div className={cn("w-full max-w-full overflow-hidden", className)}>
      {component}
    </div>
  );
};
