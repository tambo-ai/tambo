"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ComponentCodePreviewProps {
  component: React.ReactNode;
  code: string;
  language?: string;
  className?: string;
  previewClassName?: string;
  /** Force the preview container to render full-bleed without padding. */
  fullBleed?: boolean;
  title?: string;
  /** Minimum height of the preview container in pixels. Defaults to 350px. */
  minHeight?: number;
  /** Enable fullscreen dialog for the preview. Shows "Go Full Screen" button. */
  enableFullscreen?: boolean;
  /** Title for fullscreen dialog. Defaults to "Component Demo" */
  fullscreenTitle?: string;
}

export function ComponentCodePreview({
  component,
  code,
  language = "tsx",
  className,
  previewClassName = "p-8",
  fullBleed = false,
  title,
  minHeight = 350,
  enableFullscreen = false,
  fullscreenTitle = "Component Demo",
}: ComponentCodePreviewProps) {
  // For full-bleed components, use fixed height so children with h-full can fill properly
  const isFullBleed = fullBleed;
  const heightStyle = isFullBleed
    ? { height: `${minHeight}px` }
    : { minHeight: `${minHeight}px` };
  const [isFullScreen, setIsFullScreen] = useState(false);
  return (
    <div className={cn("not-prose w-full", className)}>
      {title && <h3 className="text-base font-500 mb-4">{title}</h3>}

      <Tabs defaultValue="preview" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-[200px] grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          {enableFullscreen && (
            <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  Go Full Screen
                </Button>
              </DialogTrigger>

              <DialogContent className="fixed inset-0 w-screen h-screen max-w-none p-0 gap-0 overflow-hidden">
                <DialogTitle asChild>
                  <VisuallyHidden>{fullscreenTitle}</VisuallyHidden>
                </DialogTitle>
                <div className="absolute inset-0 bg-gradient-to-br from-background via-background/98 to-muted/30">
                  <div className="absolute top-0 left-0 right-0 h-[var(--header-height)] z-50 border-b border-border/40 bg-gradient-to-b from-background/95 to-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
                    <div className="h-full px-8 flex items-center justify-between">
                      <h2 className="text-lg font-semibold">
                        {fullscreenTitle}
                      </h2>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                          Exit Full Screen
                        </Button>
                      </DialogTrigger>
                    </div>
                  </div>
                  {isFullScreen && (
                    <div className="h-full w-full pt-[var(--header-height)] bg-gradient-to-br from-muted/10 via-transparent to-background/5 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)]">
                      {component}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="preview" className="mt-4">
          <div
            className={cn(
              "relative rounded-md border border-border w-full",
              // Use flex layout for full-bleed components (p-0) so children can fill height
              isFullBleed && "flex flex-col",
              previewClassName,
            )}
            style={heightStyle}
          >
            {isFullScreen ? null : component}
          </div>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <SyntaxHighlighter code={code} language={language} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
