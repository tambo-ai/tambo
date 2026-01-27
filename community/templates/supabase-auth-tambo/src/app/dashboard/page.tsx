"use client";

import { ChatInterface } from "@/components/chat/chat-interface-v2";
import { DatabaseSetup } from "@/components/database-setup";
import { useAuth } from "@/contexts/auth-context";
import "@/lib/polyfills";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const isUserLoading = !user;

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (!process.env.NEXT_PUBLIC_TAMBO_API_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Missing NEXT_PUBLIC_TAMBO_API_KEY</p>
      </div>
    );
  }

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY}
      components={components}
      tools={tools}
      initialMessages={[
        {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Hello! I can help you view and update your profile. Try asking me to show your profile or save a note.",
            },
          ],
          additionalContext: { userId: user?.id },
        },
      ]}
    >
      <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08)_0,_transparent_45%),_radial-gradient(circle_at_20%_20%,_rgba(16,185,129,0.08)_0,_transparent_35%),_background]">
        <DatabaseSetup />
        <header className="border-b border-border/70 bg-background/70 backdrop-blur sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">
                Tambo Starter
              </p>
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                Supabase + Tambo
              </h1>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 ml-auto whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-6 sm:py-10 w-full">
          <div className="w-full grid gap-6 lg:grid-cols-[1fr_280px] 2xl:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6 min-w-0">
              <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur p-6 shadow-lg w-full">
                <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
                  <div className="w-full">
                    <p className="text-sm text-muted-foreground">
                      Welcome back
                    </p>
                    {isUserLoading ? (
                      <div className="mt-1 h-6 w-40 rounded bg-muted animate-pulse" />
                    ) : (
                      <h2 className="text-xl font-semibold break-words">
                        {user?.user_metadata?.name || user?.email}
                      </h2>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground w-full sm:text-right">
                    <p className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs sm:text-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                      Connected
                    </p>
                    <p className="font-medium text-foreground text-xs sm:text-sm mt-2 sm:mt-0">
                      Tools: profile read/write
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Ask the assistant to view your profile or update your saved
                  note. Everything is backed by Supabase and executed via Tambo
                  tools.
                </p>
              </div>

              <ChatInterface />
            </div>

            <div className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur p-4 shadow-md w-full">
                <p className="text-sm font-semibold text-foreground">
                  Quick tips
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="break-words">
                    • Say "Show my profile" to fetch Supabase data.
                  </li>
                  <li className="break-words">
                    • Say "Save a note saying …" to write to Supabase.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur p-4 shadow-md w-full">
                <p className="text-sm font-semibold text-foreground">Tooling</p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">getUserProfile</span>
                    <span className="rounded-full bg-emerald-500/15 text-emerald-700 px-2 py-0.5 text-xs whitespace-nowrap">
                      read
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">updateUserNote</span>
                    <span className="rounded-full bg-blue-500/15 text-blue-700 px-2 py-0.5 text-xs whitespace-nowrap">
                      write
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </TamboProvider>
  );
}
