"use client";

import { TamboChatInput } from "./chat-input";
import { TamboMessageList } from "./message-list";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { X } from "lucide-react";

interface AskTamboSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sheet panel component for "ask tambo" chat interface.
 * Matches the design pattern from the web app.
 */
export function AskTamboSheet({ open, onOpenChange }: AskTamboSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-white border-l border-gray-200"
      >
        <SheetTitle className="sr-only">ask tambo</SheetTitle>
        {/* Header */}
        <div className="flex items-center justify-between w-full p-4 border-b border-gray-200 shadow-sm">
          <span className="font-heading text-base font-semibold leading-tight tracking-tighter">
            ask tambo
          </span>
          <button
            type="button"
            className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <TamboMessageList />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <TamboChatInput />
        </div>
      </SheetContent>
    </Sheet>
  );
}
