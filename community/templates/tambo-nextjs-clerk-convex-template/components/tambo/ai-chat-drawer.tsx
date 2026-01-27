"use client";

import { TamboThreadProvider } from "@tambo-ai/react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TamboChatInput } from "./chat-input";
import { TamboMessageList } from "./message-list";
import { Sparkles } from "lucide-react";
import { useState } from "react";

/**
 * AI Chat Drawer component.
 * Opens a drawer with the AI assistant for creating notes.
 */
export function AIChatDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI Assistant</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Notes Assistant
            </DrawerTitle>
          </DrawerHeader>
          <TamboThreadProvider>
            <div className="px-4 pb-4">
              {/* Messages area */}
              <div className="h-[50vh] overflow-y-auto mb-4 pr-2">
                <TamboMessageList />
              </div>

              {/* Input area */}
              <div className="border-t border-border/50 pt-4">
                <TamboChatInput />
              </div>
            </div>
          </TamboThreadProvider>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
