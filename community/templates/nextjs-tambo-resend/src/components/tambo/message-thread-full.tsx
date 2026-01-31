"use client";

import type { messageVariants } from "@/components/tambo/message";
import {
  MessageInput,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpPromptButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/tambo/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
} from "@/components/tambo/message-suggestions";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
  ThreadContainer,
  useThreadContainerContext,
} from "@/components/tambo/thread-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  useThreadHistoryContext,
} from "@/components/tambo/thread-history";
import { useMergeRefs } from "@/lib/thread-hooks";
import type { Suggestion } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { X, Mail, Clock, FileEdit } from "lucide-react";
import { listEmails } from "@/services/list-emails";
import { SendButton } from "@/components/tambo/send-button";
import { DraftButton } from "@/components/tambo/draft-button";
import { ContactButton } from "@/components/tambo/contact-button";
import { ContactListModal } from "@/components/tambo/contact-list-modal";

/**
 * Email list modal component
 */
interface EmailListModalProps {
  emails: Array<{
    id: string;
    to: string;
    subject: string;
    body: string;
    status: "sent" | "draft";
    createdAt: Date;
  }>;
  type: "sent" | "draft";
  isLoading: boolean;
  onClose: () => void;
}

const EmailListModal = React.forwardRef<HTMLDivElement, EmailListModalProps>(
  ({ emails, type, isLoading, onClose }, ref) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div
          ref={ref}
          className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              {type === "sent" ? (
                <Mail className="h-5 w-5 text-green-600" />
              ) : (
                <FileEdit className="h-5 w-5 text-orange-600" />
              )}
              <h2 className="text-lg font-semibold">
                {type === "sent" ? "Sent Emails" : "Draft Emails"}
              </h2>
              <span className="text-sm text-muted-foreground">
                ({emails.length})
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-backdrop rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading emails...</div>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground mb-2">
                  No {type} emails found
                </div>
                <p className="text-sm text-muted-foreground">
                  {type === "sent"
                    ? "Emails you send will appear here"
                    : "Save drafts to see them here"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">To:</span>
                          <span className="text-sm text-muted-foreground">
                            {email.to}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground">
                          {email.subject}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                         {email.createdAt
                            ? new Date(email.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "—"}
                        </span>

                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {email.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
EmailListModal.displayName = "EmailListModal";

/**
 * Props for the MessageThreadFull component
 */
export interface MessageThreadFullProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional context key for the thread */
  contextKey?: string;
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@/components/tambo/message".
   * @example variant="compact"
   */
  variant?: VariantProps<typeof messageVariants>["variant"];
  /** Optional callback for send button click */
  onSendClick?: () => void;
  /** Optional callback for draft button click */
  onDraftClick?: () => void;
}

/**
 * A full-screen chat thread component with message history, input, and suggestions
 */
export const MessageThreadFull = React.forwardRef<
  HTMLDivElement,
  MessageThreadFullProps
>(
  (
    { className, contextKey, variant, onSendClick, onDraftClick, ...props },
    ref,
  ) => {
    const { containerRef, historyPosition } = useThreadContainerContext();
    const mergedRef = useMergeRefs<HTMLDivElement | null>(ref, containerRef);

    // State for managing email list view
    const [emailView, setEmailView] = React.useState<
      "sent" | "draft" | null
    >(null);
    const [emails, setEmails] = React.useState<
      Array<{
        id: string;
        to: string;
        subject: string;
        body: string;
        status: "sent" | "draft";
        createdAt: Date;
      }>
    >([]);
    const [isLoadingEmails, setIsLoadingEmails] = React.useState(false);

    // State for managing contact list view
    const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);

    // Function to load emails based on status
    const loadEmails = React.useCallback(
      async (status: "sent" | "draft") => {
        setIsLoadingEmails(true);
        try {
          const emailList = await listEmails(status);
          setEmails(emailList);
          setEmailView(status);
        } catch (error) {
          console.error("Failed to load emails:", error);
        } finally {
          setIsLoadingEmails(false);
        }
      },
      [],
    );

    // Handle send button click
    const handleSendClick = React.useCallback(async () => {
      await loadEmails("sent");
      onSendClick?.();
    }, [loadEmails, onSendClick]);

    // Handle draft button click
    const handleDraftClick = React.useCallback(async () => {
      await loadEmails("draft");
      onDraftClick?.();
    }, [loadEmails, onDraftClick]);

    // Handle contact button click
    const handleContactClick = React.useCallback(() => {
      setIsContactModalOpen(true);
    }, []);

    // Close email view
    const closeEmailView = React.useCallback(() => {
      setEmailView(null);
      setEmails([]);
    }, []);

    const threadHistorySidebar = (
      <ThreadHistory contextKey={contextKey} position={historyPosition}>
        <ThreadHistoryHeader />
        <SendButton onClick={handleSendClick} />
        <DraftButton onClick={handleDraftClick} />
        <ContactButton onClick={handleContactClick} />
        <ThreadHistoryNewButton />
        <ThreadHistorySearch />
        <ThreadHistoryList />
      </ThreadHistory>
    );

    const defaultSuggestions: Suggestion[] = [
      {
        id: "suggestion-1",
        title: "Get started",
        detailedSuggestion: "What can you help me with?",
        messageId: "welcome-query",
      },
      {
        id: "suggestion-2",
        title: "Learn more",
        detailedSuggestion: "Tell me about your capabilities.",
        messageId: "capabilities-query",
      },
      {
        id: "suggestion-3",
        title: "Examples",
        detailedSuggestion: "Show me some example queries I can try.",
        messageId: "examples-query",
      },
    ];

    return (
      <>
        <div className="flex h-full w-full">
          {/* Thread History Sidebar - rendered first if history is on the left */}
          {historyPosition === "left" && threadHistorySidebar}

          <ThreadContainer
            ref={mergedRef}
            disableSidebarSpacing
            className={className}
            {...props}
          >
            <ScrollableMessageContainer className="p-4">
              <ThreadContent variant={variant}>
                <ThreadContentMessages />
              </ThreadContent>
            </ScrollableMessageContainer>

            {/* Message suggestions status */}
            <MessageSuggestions>
              <MessageSuggestionsStatus />
            </MessageSuggestions>

            {/* Message input */}
            <div className="px-4 pb-4">
              <MessageInput contextKey={contextKey}>
                <MessageInputTextarea placeholder="Type your message or paste images..." />
                <MessageInputToolbar>
                  <MessageInputFileButton />
                  <MessageInputMcpPromptButton />
                  {/* Uncomment this to enable client-side MCP config modal button */}
                  {/* <MessageInputMcpConfigButton /> */}
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInput>
            </div>

            {/* Message suggestions */}
            <MessageSuggestions initialSuggestions={defaultSuggestions}>
              <MessageSuggestionsList />
            </MessageSuggestions>
          </ThreadContainer>

          {/* Thread History Sidebar - rendered last if history is on the right */}
          {historyPosition === "right" && threadHistorySidebar}
        </div>

        {/* Email List Modal */}
        {emailView && (
          <EmailListModal
            emails={emails}
            type={emailView}
            isLoading={isLoadingEmails}
            onClose={closeEmailView}
          />
        )}

        {/* Contact List Modal */}
        <ContactListModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
      </>
    );
  },
);
MessageThreadFull.displayName = "MessageThreadFull";