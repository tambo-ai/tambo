import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const [isFullScreen, setIsFullScreen] = useState(false);

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
        {!hidePreviewHeading && <h2 className="text-xl font-500">Preview</h2>}
        <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              Go Full Screen
            </Button>
          </DialogTrigger>

          {/* Fullscreen view */}
          <DialogContent className="fixed inset-0 w-screen h-screen max-w-none p-0 gap-0 overflow-hidden">
            <DialogTitle asChild>
              <VisuallyHidden>{title} Demo</VisuallyHidden>
            </DialogTitle>
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/98 to-muted/30">
              {/* Header in fullscreen mode */}
              <div className="absolute top-0 left-0 right-0 h-[var(--header-height)] z-50 border-b border-border/40 bg-gradient-to-b from-background/95 to-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
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
              {isFullScreen && (
                <div className="h-full w-full pt-[var(--header-height)] bg-gradient-to-br from-muted/10 via-transparent to-background/5 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)]">
                  {children}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Regular view */}
      <div
        className={cn(
          "relative rounded-lg bg-gradient-to-br from-background via-background/98 to-muted/20 border border-border/40 shadow-[0_0_15px_-3px_rgba(0,0,0,0.1),0_0_6px_-2px_rgba(0,0,0,0.05)] overflow-hidden",
          className,
        )}
        style={{ height: containerHeight }}
      >
        <div className="h-full w-full">
          <div className="h-full w-full">{isFullScreen ? null : children}</div>
        </div>
      </div>
    </div>
  );
}
