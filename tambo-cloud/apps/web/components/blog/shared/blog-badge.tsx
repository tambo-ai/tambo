import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS, CATEGORY_DISPLAY_MAP } from "@/lib/blog/constants";
import type { BlogCategory } from "@/lib/blog/types";
import { cn } from "@/lib/utils";

interface BlogBadgeProps {
  category: BlogCategory;
  className?: string;
  variant?: "default" | "secondary" | "outline";
}

export function BlogBadge({
  category,
  className,
  variant = "secondary",
}: BlogBadgeProps) {
  const displayName = CATEGORY_DISPLAY_MAP[category];
  const colorClass = CATEGORY_COLORS[category];

  return (
    <Badge
      variant={variant}
      className={cn(variant === "secondary" && colorClass, className)}
    >
      <span className="uppercase">{displayName}</span>
    </Badge>
  );
}
