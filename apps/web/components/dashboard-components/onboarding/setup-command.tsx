"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy } from "lucide-react";
import { type FC, useId, useRef, useState } from "react";

interface TamboSetupCommandProps {
  label: string;
  command: string;
}

export const TamboSetupCommand: FC<TamboSetupCommandProps> = ({
  label,
  command,
}) => {
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">(
    "idle",
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  const handleCopy = async () => {
    setStatus("copying");
    try {
      await navigator.clipboard.writeText(command);
      setStatus("copied");
    } catch {
      setStatus("error");
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => void handleCopy()}
          disabled={status === "copying"}
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          {status === "copied" ? (
            <Check aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Copy aria-hidden="true" className="h-4 w-4" />
          )}
          {status === "copied" ? "Copied" : "Copy"}
        </Button>
      </div>
      <Textarea
        id={id}
        ref={inputRef}
        value={command}
        readOnly
        wrap="off"
        rows={command.split("\n").length}
        className="resize-none bg-background font-mono text-sm"
        aria-describedby={status === "error" ? `${id}-error` : undefined}
      />
      <span className="sr-only" role="status">
        {status === "copied" ? `${label} copied.` : ""}
      </span>
      {status === "error" && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          Copy is unavailable. The command is selected so you can copy it
          manually.
        </p>
      )}
    </div>
  );
};
