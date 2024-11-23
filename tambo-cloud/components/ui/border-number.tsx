import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";

interface BorderTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
}

export const BorderText = forwardRef<HTMLDivElement, BorderTextProps>(
  ({ text, className, ...props }, ref) => {
    return (
      <div className="flex items-center justify-center">
        <span
          ref={ref}
          style={{ "--text": `'${text}'` } as React.CSSProperties}
          className={cn(
            `relative font-mono pointer-events-none text-center text-[6rem] font-bold leading-none before:bg-gradient-to-b before:from-neutral-300 before:to-neutral-200/70 dark:before:from-neutral-700/70 dark:before:to-neutral-800/30 before:to-80% before:bg-clip-text before:text-transparent before:content-[var(--text)] after:absolute after:inset-0 after:bg-neutral-400/70 dark:after:bg-neutral-600/70 after:bg-clip-text after:text-transparent after:mix-blend-darken dark:after:mix-blend-lighten after:content-[var(--text)] after:[text-shadow:0_1px_0_white] dark:after:[text-shadow:0_1px_0_black]`,
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

BorderText.displayName = "BorderText";
