/**
 * @file DocExplanation.tsx
 * @description A Tambo component that displays formatted documentation explanations
 */

"use client";

import { z } from "zod";

export const docExplanationSchema = z.object({
  title: z.string().describe("Title of the documentation topic"),
  content: z.string().describe("Detailed explanation content"),
  category: z
    .string()
    .describe(
      "Category of the documentation (e.g., 'React Hooks', 'Components')",
    ),
});

export type DocExplanationProps = z.infer<typeof docExplanationSchema>;

export function DocExplanation({
  title,
  content,
  category,
}: DocExplanationProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-lg">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-primary to-purple-500" />

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {category}
        </span>
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert">
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}
