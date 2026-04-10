import { Loader2, Trash2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface DestructiveActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isPending?: boolean;
  "aria-label": string;
  label?: string;
  pendingLabel?: string;
  className?: string;
}

export function DestructiveActionButton({
  onClick,
  disabled,
  isPending,
  "aria-label": ariaLabel,
  label = "Delete",
  pendingLabel = "Deleting...",
  className,
}: DestructiveActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled ?? isPending}
      aria-label={ariaLabel}
      className={cn(
        "gap-1 text-destructive hover:text-destructive hover:bg-destructive/10",
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      )}
      {isPending ? pendingLabel : label}
    </Button>
  );
}
