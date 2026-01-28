"use client";

import { MessageInput } from "@/components/tambo/message-input";
import { MessageSuggestions } from "@/components/tambo/message-suggestions";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import { useAuth } from "@/contexts/auth-context";
import { components, createTools } from "@/lib/tambo/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  const tools = useMemo(
    () =>
      user?.id && user?.email
        ? createTools(
            user.id,
            user.email,
            user.user_metadata?.name as string | undefined,
          )
        : [],
    [user?.id, user?.email, user?.user_metadata?.name],
  );

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (!process.env.NEXT_PUBLIC_TAMBO_API_KEY) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">Missing NEXT_PUBLIC_TAMBO_API_KEY</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY}
      components={components}
      tools={tools}
    >
      <div className="flex h-screen w-full flex-col">
        {/* Header */}
        <header className="border-b">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="rounded border px-3 py-1 text-sm hover:bg-muted"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Chat */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ScrollableMessageContainer className="flex-1 p-4">
            <div className="mx-auto max-w-3xl">
              <ThreadContent>
                <ThreadContentMessages />
              </ThreadContent>
            </div>
          </ScrollableMessageContainer>

          <div className="border-t p-4">
            <div className="mx-auto max-w-3xl space-y-2">
              <MessageSuggestions maxSuggestions={3} />
              <MessageInput />
            </div>
          </div>
        </div>
      </div>
    </TamboProvider>
  );
}
