"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";

interface DemoWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Height of the demo container. Defaults to 650px */
  height?: string | number;
  /** Hide the Preview heading. Defaults to false */
  hidePreviewHeading?: boolean;
}

export function DemoWrapper({
  children,
  className,
  height = "650px",
  hidePreviewHeading = false,
}: DemoWrapperProps) {
  const containerHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
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
            <ShowcaseThemeProvider defaultTheme="light">
              <div className="absolute inset-0 bg-background">
                <div className="absolute top-8 right-8 z-50">
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      Exit Full Screen
                    </Button>
                  </DialogTrigger>
                </div>
                <div className="h-full w-full p-6">{children}</div>
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
