import { MessageThread } from "@/components/tambo/message-thread";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

/**
 * ChatPage - Protected chat route with polished runtime-driven UI layout.
 *
 * Layout principles:
 * - Full viewport height (h-screen) - chat thread is primary surface
 * - Minimal header with max-w-4xl alignment - matches chat container
 * - MessageThread fills remaining space - no wasted whitespace
 * - Centered, constrained experience - max-w-4xl throughout
 */
export default async function ChatPage() {
  const user = await currentUser();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Minimal header - aligned with chat container */}
      <header className="border-b border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-foreground hover:opacity-80"
          >
            Clerk + Tambo
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.emailAddresses[0]?.emailAddress}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Chat thread - primary surface, fills remaining space */}
      <main className="flex-1 overflow-hidden">
        <MessageThread />
      </main>
    </div>
  );
}
