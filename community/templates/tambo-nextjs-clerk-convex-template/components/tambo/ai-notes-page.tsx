"use client";

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
import { AIChatDrawer } from "./ai-chat-drawer";
import { CreateNoteDialog } from "./create-note-dialog";
import { NotesGrid } from "./notes-grid";
import { Sparkles, LogIn, Loader2 } from "lucide-react";

/**
 * Main AI Notes page component.
 * Clean notes view with AI assistant in a drawer.
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto flex h-14 items-center justify-between px-4">
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
            <AIChatDrawer />
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

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Your Notes</h1>
          <p className="text-muted-foreground mt-1">
            Click on a note to edit, or use the AI assistant to create new ones
          </p>
        </div>

        <NotesGrid />
      </main>
    </div>
  );
}
