"use client";

import { CLI } from "@/components/cli";
import { Button } from "@/components/ui/button";
import {
  MessageInput,
  MessageInputError,
  MessageInputFileButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/ui/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
} from "@/components/ui/message-suggestions";
import { ScrollableMessageContainer } from "@/components/ui/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/ui/thread-content";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
} from "@/components/ui/thread-history";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import * as Collapsible from "@radix-ui/react-collapsible";
import { MessageCircle, PlusIcon } from "lucide-react";
import { DemoWrapper } from "../../demo-wrapper";

export default function MessageThreadCollapsiblePage() {
  const userContextKey = useUserContextKey("message-thread-collapsible");
  const installCommand = "npx tambo add message-thread-collapsible";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">
              Message Thread Collapsible
            </h1>
            <p className="text-lg text-secondary">
              A collapsible message thread component with chat history and input
              field.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          <DemoWrapper title="Message Thread Collapsible">
            <div className="flex-1 bg-muted/20 flex flex-col gap-4 p-6 h-full relative">
              <div className="h-8 w-[200px] bg-muted/80 rounded-md" />
              <div className="h-4 w-[300px] bg-muted/80 rounded-md" />
              <div className="h-4 w-[250px] bg-muted/80 rounded-md" />
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="h-32 bg-muted/80 rounded-lg" />
                <div className="h-32 bg-muted/80 rounded-lg" />
                <div className="h-32 bg-muted/80 rounded-lg" />
              </div>
              <div className="mt-4 h-4 w-[280px] bg-muted/80 rounded-md" />
              <div className="h-4 w-[320px] bg-muted/80 rounded-md" />
              <div className="flex-grow" />
              <div className="h-4 w-[250px] bg-muted/80 rounded-md" />
              <div className="h-4 w-[200px] bg-muted/80 rounded-md" />
              <Collapsible.Root>
                <Collapsible.Trigger asChild>
                  <Button
                    variant="floating"
                    size="sm"
                    aria-label="Open chat"
                    className="absolute bottom-6 right-4"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat with Tambo
                  </Button>
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <div className="absolute bottom-20 right-4 z-50 w-[768px] rounded-lg bg-background border border-border shadow-lg overflow-hidden">
                    <div className="h-[500px] flex">
                      {/* Sidebar */}
                      <ThreadHistory
                        contextKey={userContextKey}
                        position="left"
                        defaultCollapsed={true}
                        className="h-full"
                      >
                        <ThreadHistoryHeader>My Assistant</ThreadHistoryHeader>
                        <ThreadHistoryNewButton>
                          <PlusIcon className="h-4 w-4" />
                          New
                        </ThreadHistoryNewButton>
                        <ThreadHistorySearch />
                        <ThreadHistoryList />
                      </ThreadHistory>

                      {/* Main content */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <ScrollableMessageContainer className="p-4">
                          <ThreadContent>
                            <ThreadContentMessages />
                          </ThreadContent>
                        </ScrollableMessageContainer>

                        <MessageSuggestions>
                          <MessageSuggestionsStatus />
                        </MessageSuggestions>

                        <div className="p-4">
                          <MessageInput contextKey={userContextKey}>
                            <MessageInputTextarea placeholder="Type your message or paste images..." />
                            <MessageInputToolbar>
                              <MessageInputFileButton />
                              <MessageInputSubmitButton />
                            </MessageInputToolbar>
                            <MessageInputError />
                          </MessageInput>
                        </div>

                        <MessageSuggestions
                          initialSuggestions={[
                            {
                              id: "s1",
                              title: "Get started",
                              detailedSuggestion: "What can you help me with?",
                              messageId: "welcome-query",
                            },
                            {
                              id: "s2",
                              title: "Learn more",
                              detailedSuggestion:
                                "Tell me about your capabilities.",
                              messageId: "capabilities-query",
                            },
                            {
                              id: "s3",
                              title: "Examples",
                              detailedSuggestion:
                                "Show me some example queries.",
                              messageId: "examples-query",
                            },
                          ]}
                        >
                          <MessageSuggestionsList />
                        </MessageSuggestions>
                      </div>
                    </div>
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
            </div>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
