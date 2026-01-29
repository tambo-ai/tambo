"use client";

import { TamboThreadProvider } from "@tambo-ai/react";
import { useConvexAuth } from "convex/react";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { CreateNoteDialog } from "./create-note-dialog";
import { NotesGrid } from "./notes-grid";
import { AskTamboTrigger } from "./ask-tambo-trigger";
import { AskTamboSheet } from "./ask-tambo-sheet";
import { useState, useEffect } from "react";

/**
 * Sign-in page component matching the web app's design.
 */
function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-heading text-3xl md:text-5xl font-medium tracking-tighter leading-tight">
            Welcome to AI Notes
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Create and manage notes with natural language
          </p>
        </div>

        <div className="flex justify-center">
          <SignInButton mode="modal">
            <Button
              variant="default"
              className="w-full h-12 text-base font-medium active:scale-95 transition-transform"
            >
              Get Started
            </Button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
}

/**
 * Main AI Notes page component.
 * Full-width notes grid with "ask tambo" sheet panel overlay.
 */
export function AINotesPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K to toggle sheet
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsSheetOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInPage />;
  }

  return (
    <TamboThreadProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold text-lg leading-tight tracking-tighter">
                AI Notes
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CreateNoteDialog />
              <AskTamboTrigger onClick={() => setIsSheetOpen(true)} />
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

        {/* Main Content - Full Width Notes Grid */}
        <main className="container max-w-7xl mx-auto py-6 px-4">
          <div className="space-y-4">
            <div>
              <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tighter">
                Your Notes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Click on a note to edit, or use the AI assistant to create new
                ones
              </p>
            </div>

            <NotesGrid />
          </div>
        </main>

        {/* Ask Tambo Sheet */}
        <AskTamboSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
      </div>
    </TamboThreadProvider>
  );
}
