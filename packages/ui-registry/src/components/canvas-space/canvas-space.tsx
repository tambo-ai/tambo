"use client";

import {
  CanvasSpace as CanvasSpaceBase,
  type CanvasSpaceContentRenderProps,
} from "@tambo-ai/react-ui-base/canvas-space";
import { cn } from "@tambo-ai/ui-registry/utils";

/**
 * Props for the CanvasSpace component
 * @interface
 */
interface CanvasSpaceProps {
  /** Optional CSS class name for custom styling */
  className?: string;
}

/**
 * A canvas space component that displays rendered components from chat messages.
 * @component
 * @example
 * ```tsx
 * <CanvasSpace className="custom-styles" />
 * ```
 * @returns The styled canvas space component
 */
export function CanvasSpace({ className }: CanvasSpaceProps) {
  return (
    <CanvasSpaceBase.Root
      className={cn(
        "h-screen flex-1 flex flex-col bg-background/50 backdrop-blur-sm overflow-hidden border-l border-border",
        className,
      )}
    >
      <CanvasSpaceBase.Viewport className="w-full flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
        <div className="p-8 h-full flex flex-col">
          <CanvasSpaceBase.Content
            className="h-full space-y-6 pb-8 flex flex-col items-center justify-center w-full"
          >
            {({ renderedComponent }: CanvasSpaceContentRenderProps) => (
              <div
                className={cn(
                  "w-full transition-all duration-200 ease-out transform flex justify-center",
                  "opacity-100 scale-100",
                )}
              >
                {renderedComponent}
              </div>
            )}
          </CanvasSpaceBase.Content>
          <CanvasSpaceBase.EmptyState className="flex-1 flex items-center justify-center text-center p-6">
            <div className="space-y-2">
              <p className="text-muted-foreground font-medium">
                Canvas is empty
              </p>
              <p className="text-sm text-muted-foreground">
                Interactive components will appear here as they are generated
              </p>
            </div>
          </CanvasSpaceBase.EmptyState>
        </div>
      </CanvasSpaceBase.Viewport>
    </CanvasSpaceBase.Root>
  );
}
