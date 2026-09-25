"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClipboard } from "@/hooks/use-clipboard";
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
  const [status, setStatus] = useState<"idle" | "copying" | "error">("idle");
  const [copied, copy] = useClipboard(command);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  const handleCopy = async () => {
    if (status === "copying") return;
    setStatus("copying");
    try {
      if (!(await copy())) throw new Error("Clipboard unavailable");
      setStatus("idle");
    } catch {
      setStatus("error");
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium" htmlFor={id} id={`${id}-label`}>
          {label}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => void handleCopy()}
          aria-disabled={status === "copying"}
          aria-labelledby={`${id}-copy-action ${id}-label`}
        >
          {copied && status !== "error" ? (
            <Check aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Copy aria-hidden="true" className="h-4 w-4" />
          )}
          <span id={`${id}-copy-action`}>
            {copied && status !== "error" ? "Copied" : "Copy"}
          </span>
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
        {copied && status !== "error" ? `${label} copied.` : ""}
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
