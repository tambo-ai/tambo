"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { ButtonHTMLAttributes, useCallback, useState } from "react";
import { Button } from "./ui/button";

export interface CopyButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  clipboardValue: string;
  successDuration?: number;
}

export function CopyButton({
  clipboardValue,
  successDuration = 2000,
  className,
  children,
  onClick,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      // Call the original onClick if provided
      onClick?.(event);
      event.stopPropagation();

      try {
        await navigator.clipboard.writeText(clipboardValue);
        setCopied(true);
        setTimeout(() => setCopied(false), successDuration);
      } catch (error) {
        console.error("Failed to copy text:", error);
      }
    },
    [clipboardValue, onClick, successDuration],
  );

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center transition-colors",
        className,
      )}
      {...props}
    >
      {children ?? (copied ? "Copied!" : "Copy")}
    </Button>
  );
}
