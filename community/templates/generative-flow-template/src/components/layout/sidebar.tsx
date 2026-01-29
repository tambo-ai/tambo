"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutGrid, MessageSquare, Settings } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div
      className={cn(
        "pb-12 w-64 border-r min-h-screen bg-background flex flex-col",
        className,
      )}
    >
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Generative Flow
          </h2>
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Workflow Editor
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat Assistant
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Library
          </h2>
          <ScrollArea className="h-[200px] px-1">
            <div className="space-y-1 p-2">
              <div className="text-sm text-muted-foreground pl-2">
                Ready to generate...
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="px-4 border-t pt-4 text-xs text-muted-foreground text-center">
        Template Mode
      </div>
    </div>
  );
}
