"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlogSortOptions } from "@/lib/blog/types";

interface BlogSortProps {
  value: BlogSortOptions;
  onChange: (options: BlogSortOptions) => void;
}

export function BlogSort({ value, onChange }: BlogSortProps) {
  const handleChange = (sortValue: string) => {
    const [field, order] = sortValue.split("-") as [
      BlogSortOptions["field"],
      BlogSortOptions["order"],
    ];
    onChange({ field, order });
  };

  const currentValue = `${value.field}-${value.order}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort:</span>
      <Select value={currentValue} onValueChange={handleChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date-desc">Newest</SelectItem>
          <SelectItem value="date-asc">Oldest</SelectItem>
          <SelectItem value="title-asc">Title A-Z</SelectItem>
          <SelectItem value="title-desc">Title Z-A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
