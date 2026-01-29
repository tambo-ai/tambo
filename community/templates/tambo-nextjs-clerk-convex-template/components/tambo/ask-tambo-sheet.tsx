"use client";

import { TamboChatInput } from "./chat-input";
import { TamboMessageList } from "./message-list";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface AskTamboSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shared chat content component used in both Sheet and Drawer.
 */
function ChatContent({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between w-full p-4 border-b border-gray-200 shadow-sm">
        <span className="font-heading text-base font-semibold leading-tight tracking-tighter">
          ask tambo
        </span>
        <button
          type="button"
          className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={onClose}
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
    </>
  );
}

/**
 * Responsive component for "ask tambo" chat interface.
 * Uses Sheet (right side) on desktop and Drawer (bottom, half height) on mobile.
 */
export function AskTamboSheet({ open, onOpenChange }: AskTamboSheetProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile: Use Drawer (bottom, half height)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="flex flex-col p-0 bg-white max-h-[50vh] border-t border-gray-200">
          <DrawerTitle className="sr-only">ask tambo</DrawerTitle>
          <ChatContent />
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Sheet (right side)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex flex-col p-0 bg-white w-full max-w-lg border-l border-gray-200"
      >
        <SheetTitle className="sr-only">ask tambo</SheetTitle>
        <ChatContent onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
