import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SortDirection, SortField } from "../observability/hooks/useThreadList";

interface SortIconProps {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
}

export function SortIcon({ field, currentField, direction }: SortIconProps) {
  const isActive = currentField === field;
  const isAscending = isActive && direction === "asc";
  const isDescending = isActive && direction === "desc";

  return (
    <div className="flex flex-col">
      <ChevronUp
        className={cn(
          "h-3 w-3 transition-colors",
          isAscending
            ? "text-foreground font-bold"
            : "text-muted-foreground/50",
        )}
      />
      <ChevronDown
        className={cn(
          "h-3 w-3 -mt-1 transition-colors",
          isDescending
            ? "text-foreground font-bold"
            : "text-muted-foreground/50",
        )}
      />
    </div>
  );
}
