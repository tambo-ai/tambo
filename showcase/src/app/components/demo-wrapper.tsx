"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { cn } from "@/lib/utils";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";

interface DemoWrapperProps {
  children: React.ReactNode;
  title: string;
  className?: string;
  /** Height of the demo container. Defaults to 650px */
  height?: string | number;
  /** Hide the Preview heading. Defaults to false */
  hidePreviewHeading?: boolean;
}

export function DemoWrapper({
  children,
  title,
  className,
  height = "650px",
  hidePreviewHeading = false,
}: DemoWrapperProps) {
  const containerHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div>
      <div
        className={cn(
          "mb-4",
          hidePreviewHeading
            ? "flex justify-end"
            : "flex items-center justify-between",
        )}
      >
        {!hidePreviewHeading && (
          <h2 className="text-xl font-semibold">Preview</h2>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              Go Full Screen
            </Button>
          </DialogTrigger>

          {/* Fullscreen view - needs its own ThemeProvider since it's rendered in a portal */}
          <DialogContent className="fixed inset-0 w-screen h-screen max-w-none p-0 gap-0 overflow-hidden">
            <DialogTitle asChild>
              <VisuallyHidden>{title} Demo</VisuallyHidden>
            </DialogTitle>
            <ShowcaseThemeProvider defaultTheme="light">
              <div className="absolute inset-0 bg-background">
                {/* Header in fullscreen mode */}
                <div className="absolute top-0 left-0 right-0 h-16 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="h-full px-8 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        Exit Full Screen
                      </Button>
                    </DialogTrigger>
                  </div>
                </div>
                {/* Content area with padding to account for header */}
                <div className="h-full w-full pt-16 p-6">{children}</div>
              </div>
            </ShowcaseThemeProvider>
          </DialogContent>
        </Dialog>
      </div>

      {/* Regular view */}
      <div
        className={cn(
          "relative rounded-lg bg-background p-6 border border-border/40",
          className,
        )}
        style={{ height: containerHeight }}
      >
        <div className="h-full w-full">{children}</div>
      </div>
    </div>
  );
}
