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
 * Sign-in page component.
 */
function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-heading text-3xl md:text-5xl font-medium tracking-tighter leading-tight text-foreground">
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
              className="w-full h-12 text-base font-medium active:scale-95 transition-transform bg-[#7FFFC4] text-[#023A41] hover:bg-[#6ae9b0] hover:text-[#023A41]"
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
 * Main AI Notes page. "Ask tambo" panel slides in from the right and pushes the entire page left.
 */
export function AINotesPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInPage />;
  }

  return (
    <TamboThreadProvider>
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold text-lg leading-tight tracking-tighter text-foreground">
                AI Notes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CreateNoteDialog />
              <AskTamboTrigger onClick={() => setIsSheetOpen(true)} />
              <UserButton
                afterSignOutUrl="/"
                appearance={{ elements: { avatarBox: "h-8 w-8" } }}
              />
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 w-full overflow-hidden">
          <main className="flex-1 min-w-0 min-h-0 overflow-auto">
            <div className="container max-w-7xl mx-auto py-6 px-4">
              <div className="space-y-4">
                <div>
                  <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tighter text-foreground">
                    Your Notes
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click on a note to edit, or use the AI assistant to create
                    new ones. Notes update in real time while you chat.
                  </p>
                </div>
                <NotesGrid isSheetOpen={isSheetOpen} />
              </div>
            </div>
          </main>
          <AskTamboSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
        </div>
      </div>
    </TamboThreadProvider>
  );
}
