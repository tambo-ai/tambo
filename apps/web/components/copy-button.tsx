"use client";

import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import * as React from "react";
import { ButtonHTMLAttributes, useCallback } from "react";
import { Button } from "./ui/button";

export interface CopyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  clipboardValue: string;
  successDuration?: number;
}

export function CopyButton({
  clipboardValue,
  successDuration = 2000,
  className,
  onClick,
  ...props
}: CopyButtonProps) {
  const [copied, copy] = useClipboard(clipboardValue, successDuration);

  const handleCopy = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      // Call the original onClick if provided
      onClick?.(event);
      event.stopPropagation();

      try {
        await copy();
      } catch (error) {
        console.error("Failed to copy text:", error);
      }
    },
    [copy, onClick],
  );

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleCopy}
      className={cn("h-8 w-8 p-0", copied && "text-green-500", className)}
      {...props}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="sr-only">{copied ? "Copied!" : "Copy"}</span>
    </Button>
  );
}
