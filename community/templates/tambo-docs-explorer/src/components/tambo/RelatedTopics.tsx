/**
 * @file RelatedTopics.tsx
 * @description A Tambo component that displays related documentation links
 */

"use client";

import { ArrowRight } from "lucide-react";
import { z } from "zod";

export const relatedTopicsSchema = z.object({
  topics: z
    .array(
      z.object({
        title: z.string().describe("The title of the related topic"),
        description: z.string().describe("A brief description of the topic"),
      }),
    )
    .describe("Array of related topics to display"),
  mainTopic: z
    .string()
    .optional()
    .describe("The main topic these are related to"),
});

export type RelatedTopicsProps = z.infer<typeof relatedTopicsSchema>;

export function RelatedTopics({ topics, mainTopic }: RelatedTopicsProps) {
  return (
    <div className="my-4 rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
        {mainTopic ? `Related to ${mainTopic}` : "Related Topics"}
      </h3>

      <div className="grid gap-3">
        {topics.map((topic, index) => (
          <div
            key={index}
            className="group p-4 rounded-lg border border-border bg-muted/30 hover:border-primary/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
                  {topic.title}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-sm text-muted-foreground">
                  {topic.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {topics.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-4">
          No related topics found.
        </p>
      )}
    </div>
  );
}
