import { MessageThread } from "@/components/tambo/message-thread";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function ChatPage() {
  const user = await currentUser();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-[var(--foreground)] hover:opacity-80 transition-opacity"
          >
            Clerk + Tambo
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)] px-2 py-1">
              {user?.emailAddresses[0]?.emailAddress}
            </span>
            <div className="scale-90">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4">
        <MessageThread />
      </div>
    </main>
  );
}
