import {
  ContextAttachmentBadgeList,
  ContextAttachmentBadgeListData,
} from "@/components/ui/tambo/context-attachment-badge";
import { createMarkdownComponents } from "@tambo-ai/ui-registry/components/message";
import { useClipboard } from "@/hooks/use-clipboard";
import { getSafeContent } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Copy, Info } from "lucide-react";
import { FC, isValidElement, memo, ReactNode, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import {
  extractSelectedInteractablesFromAdditionalContext,
  formatTime,
} from "../utils";
import { HighlightedJson, HighlightText } from "./highlight";
import { MessageIdCopyButton } from "./message-id-copy-button";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

// Helper function to render markdown content with or without search highlighting
const renderMarkdownContent = (
  content: string,
  searchQuery?: string,
): JSX.Element => {
  if (searchQuery) {
    const highlightedComponents =
      createHighlightedMarkdownComponents(searchQuery);
    return (
      <ReactMarkdown
        components={highlightedComponents}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    );
  }

  return (
    <ReactMarkdown
      components={createMarkdownComponents()}
      rehypePlugins={[rehypeRaw]}
    >
      {content}
    </ReactMarkdown>
  );
};

// Helper function to create highlighted markdown components
const createHighlightedMarkdownComponents = (searchQuery: string) => {
  const baseComponents = createMarkdownComponents();

  return {
    ...baseComponents,
    p: ({ children, ...props }: any) => (
      <p {...props}>
        {typeof children === "string" ? (
          <HighlightText text={children} searchQuery={searchQuery} />
        ) : (
          children
        )}
      </p>
    ),
    li: ({ children, ...props }: any) => (
      <li {...props}>
        {typeof children === "string" ? (
          <HighlightText text={children} searchQuery={searchQuery} />
        ) : (
          children
        )}
      </li>
    ),
    td: ({ children, ...props }: any) => (
      <td {...props}>
        {typeof children === "string" ? (
          <HighlightText text={children} searchQuery={searchQuery} />
        ) : (
          children
        )}
      </td>
    ),
  };
};

// Helper function to render main content
const renderMainContent = (
  safeContent: ReactNode,
  searchQuery?: string,
): JSX.Element => {
  if (typeof safeContent === "string" && safeContent) {
    return renderMarkdownContent(safeContent, searchQuery);
  }

  if (isValidElement(safeContent)) {
    return safeContent;
  }

  return <span>No content</span>;
};

// Subcomponent for additional context section
interface AdditionalContextSectionProps {
  message: MessageType;
  showAdditionalContext: boolean;
  setShowAdditionalContext: (show: boolean) => void;
  searchQuery?: string;
}

const AdditionalContextSection: FC<AdditionalContextSectionProps> = ({
  message,
  showAdditionalContext,
  setShowAdditionalContext,
  searchQuery,
}) => {
  const formatAdditionalContext = (context: Record<string, unknown>) => {
    try {
      return JSON.stringify(context, null, 2);
    } catch {
      return String(context);
    }
  };

  const contextString = formatAdditionalContext(
    message.additionalContext || {},
  );
  const [copied, copy] = useClipboard(contextString);

  const handleCopyContext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copy();
  };

  const toggleContext = () => {
    setShowAdditionalContext(!showAdditionalContext);
  };

  return (
    <div className="mt-3 border border-border rounded-lg overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={toggleContext}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleContext();
          }
        }}
        className="w-full flex items-center justify-between p-2 sm:p-3 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Info className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="font-medium text-xs sm:text-sm text-primary">
            Additional Context
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-label="Copy additional context"
            onClick={handleCopyContext}
            className="bg-transparent m-0 border-0 p-0 text-inherit font-inherit leading-[inherit] appearance-none h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center cursor-pointer hover:bg-muted rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? (
              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
            ) : (
              <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
            )}
          </button>
          <ChevronDown
            className={cn(
              "h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 text-primary",
              showAdditionalContext && "rotate-180",
            )}
          />
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{
          height: showAdditionalContext ? "auto" : 0,
          opacity: showAdditionalContext ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="p-4 bg-background">
          <pre className="text-xs font-mono text-primary overflow-auto max-h-96">
            {searchQuery ? (
              <HighlightedJson json={contextString} searchQuery={searchQuery} />
            ) : (
              contextString
            )}
          </pre>
        </div>
      </motion.div>
    </div>
  );
};

interface MessageContentProps {
  message: MessageType;
  isUserMessage: boolean;
  isHighlighted?: boolean;
}

interface MessageContentComponentProps extends MessageContentProps {
  searchQuery?: string;
}

export const MessageContent = memo(
  ({
    message,
    isUserMessage,
    isHighlighted = false,
    searchQuery,
  }: MessageContentComponentProps) => {
    const [showAdditionalContext, setShowAdditionalContext] = useState(false);

    // Extract component names from the message's additionalContext to validate mentions
    const interactableNames = useMemo(() => {
      return extractSelectedInteractablesFromAdditionalContext(message).map(
        (ctx) => ctx.name,
      );
    }, [message]);

    const safeContent = getSafeContent(
      message.content as ReactNode,
      interactableNames,
    );

    // Check if there's additional context to display
    const hasAdditionalContext =
      isUserMessage &&
      message.additionalContext &&
      Object.keys(message.additionalContext).length > 0;

    return (
      <>
        {/* Top metadata bar */}
        <motion.div
          className={cn(
            "flex items-center gap-3 mb-3 px-1",
            isUserMessage ? "flex-row-reverse" : "flex-row",
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 text-xs text-foreground">
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </motion.div>

        {/* Message bubble */}
        <motion.div
          className={cn(
            "relative max-w-full sm:max-w-[85%] min-w-0 sm:min-w-[200px] transition-all duration-300 group-hover:shadow-lg rounded-2xl",
          )}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className={cn(
              "rounded-2xl p-3 sm:p-5 shadow-sm border backdrop-blur-sm",
              "bg-transparent text-foreground text-sm border-border",
              isHighlighted && "ring-4 ring-theme-accent ring-inset",
            )}
          >
            <div className="flex flex-col gap-2">
              <span className="text-xs text-foreground/50">{message.role}</span>

              {/* Image and context attachments */}
              <ContextAttachmentBadgeList
                message={message as ContextAttachmentBadgeListData}
                className="mb-2"
              />

              {/* Main content */}
              <div className="text-primary">
                {renderMainContent(safeContent, searchQuery)}
              </div>

              {/* Additional Context Section - Only for user messages with context */}
              {hasAdditionalContext && (
                <AdditionalContextSection
                  message={message}
                  showAdditionalContext={showAdditionalContext}
                  setShowAdditionalContext={setShowAdditionalContext}
                  searchQuery={searchQuery}
                />
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom metadata */}
        <MessageIdCopyButton
          messageId={message.id}
          isUserMessage={isUserMessage}
        />
      </>
    );
  },
);
MessageContent.displayName = "MessageContent";
