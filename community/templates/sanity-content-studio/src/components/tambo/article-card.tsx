"use client";

import { cn } from "@/lib/utils";
import { Check, Clock, FileText } from "lucide-react";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  status: "draft" | "published";
  publishedAt: string | null;
  slug: string;
}

export function ArticleCard({
  title,
  excerpt,
  status,
  publishedAt,
  slug,
}: ArticleCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article
      className={cn(
        "group relative rounded-xl border bg-[hsl(var(--card))] p-5 transition-all duration-200",
        "hover:border-[hsl(var(--ring))] hover:shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              /{slug}
            </span>
          </div>

          <h3 className="text-lg font-semibold leading-tight text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]">
            {title}
          </h3>

          <p className="line-clamp-2 text-sm text-[hsl(var(--muted-foreground))]">
            {excerpt}
          </p>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            status === "published"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}
        >
          {status === "published" ? (
            <Check className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {status === "published" ? "Published" : "Draft"}
        </div>
      </div>

      {formattedDate && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
          <Clock className="h-3 w-3" />
          {formattedDate}
        </div>
      )}
    </article>
  );
}
