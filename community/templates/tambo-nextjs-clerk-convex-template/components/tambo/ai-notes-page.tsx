"use client";

import { TamboThreadProvider } from "@tambo-ai/react";
import { useConvexAuth } from "convex/react";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TamboChatInput } from "./chat-input";
import { TamboMessageList } from "./message-list";
import { CreateNoteDialog } from "./create-note-dialog";
import { NotesGrid } from "./notes-grid";
import { Sparkles, LogIn, Loader2 } from "lucide-react";

/**
 * Main AI Notes page component.
 * Side-by-side layout showing AI chat and notes grid for real-time updates.
 */
export function AINotesPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold">AI Notes</CardTitle>
            <CardDescription className="text-base">
              Create and manage notes with natural language
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-2 pb-6">
            <SignInButton mode="modal">
              <Button size="lg" className="gap-2 px-8">
                <LogIn className="h-4 w-4" />
                Sign In to Continue
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TamboThreadProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">AI Notes</span>
              <Badge
                variant="outline"
                className="hidden sm:flex items-center gap-1.5 text-xs font-normal text-muted-foreground"
              >
                <Sparkles className="h-3 w-3" />
                Tambo
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <CreateNoteDialog />
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </div>
          </div>
        </header>

        {/* Main Content - Side by Side Layout */}
        <main className="container max-w-7xl mx-auto py-6 px-4">
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            {/* Left: AI Chat */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">AI Assistant</h2>
                <p className="text-sm text-muted-foreground">
                  Tell me what notes to create
                </p>
              </div>

              <Card className="overflow-hidden border-border/50 h-[calc(100vh-200px)] flex flex-col">
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    <TamboMessageList />
                  </div>

                  {/* Input area */}
                  <div className="border-t border-border/50 p-4 bg-muted/30 shrink-0">
                    <TamboChatInput />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Notes Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Your Notes
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Updates in real-time as you chat
                  </p>
                </div>
              </div>

              <NotesGrid />
            </div>
          </div>
        </main>
      </div>
    </TamboThreadProvider>
  );
}
