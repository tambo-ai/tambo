"use client";

import { cn } from "@/lib/utils";
import { z } from "zod";
import { BarChart3 } from "lucide-react";

/**
 * Schema for ArrayVisualizer props
 * Used by Tambo to validate and generate props
 */
export const arrayVisualizerSchema = z.object({
  title: z.string().describe("Title describing the algorithm or operation"),
  array: z.array(z.number()).describe("The array of numbers to visualize"),
  highlightIndices: z
    .array(z.number())
    .optional()
    .describe("Indices to highlight (e.g., current comparison)"),
  pointers: z
    .array(
      z.object({
        index: z.number().describe("Index position of the pointer"),
        label: z
          .string()
          .describe("Label for the pointer (e.g., 'i', 'j', 'left', 'right')"),
        color: z
          .enum(["blue", "green", "red", "yellow", "purple"])
          .optional()
          .describe("Color of the pointer"),
      }),
    )
    .optional()
    .describe("Pointers to show below specific indices"),
  caption: z
    .string()
    .optional()
    .describe("Explanation of the current state or step"),
});

export type ArrayVisualizerProps = z.infer<typeof arrayVisualizerSchema>;

const pointerColors = {
  blue: "text-blue-400 border-blue-400 bg-blue-400/10",
  green: "text-emerald-400 border-emerald-400 bg-emerald-400/10",
  red: "text-red-400 border-red-400 bg-red-400/10",
  yellow: "text-amber-400 border-amber-400 bg-amber-400/10",
  purple: "text-purple-400 border-purple-400 bg-purple-400/10",
};

/**
 * ArrayVisualizer Component
 *
 * Renders an array with optional highlighting and pointers.
 * Used for visualizing array-based algorithms like sorting, searching, etc.
 */
export function ArrayVisualizer({
  title,
  array,
  highlightIndices = [],
  pointers = [],
  caption,
}: ArrayVisualizerProps) {
  // Guard against undefined or empty array
  if (!array || array.length === 0) {
    return (
      <div className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <BarChart3 className="w-4 h-4 text-[hsl(var(--primary))]" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            No array data to display
          </p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...array, 1);

  return (
    <div className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <BarChart3 className="w-4 h-4 text-[hsl(var(--primary))]" />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))] font-mono">
          length: {array.length}
        </span>
      </div>

      {/* Array visualization */}
      <div className="p-6">
        <div className="flex items-end justify-center gap-2 min-h-[140px] mb-4">
          {array.map((value, index) => {
            const isHighlighted = highlightIndices.includes(index);
            const height = Math.max(24, (value / maxValue) * 120);

            return (
              <div key={index} className="flex flex-col items-center gap-2">
                {/* Bar */}
                <div
                  className={cn(
                    "w-12 rounded-t-lg transition-all duration-300 flex items-end justify-center pb-1 relative",
                    isHighlighted
                      ? "bg-gradient-to-t from-[hsl(var(--primary))] to-[hsl(var(--primary))]/70 shadow-lg shadow-[hsl(var(--primary))]/20"
                      : "bg-gradient-to-t from-[hsl(var(--muted-foreground))]/40 to-[hsl(var(--muted-foreground))]/20",
                  )}
                  style={{ height: `${height}px` }}
                >
                  <span
                    className={cn(
                      "text-xs font-mono font-bold",
                      isHighlighted
                        ? "text-white"
                        : "text-[hsl(var(--foreground))]",
                    )}
                  >
                    {value}
                  </span>
                </div>

                {/* Index badge */}
                <span
                  className={cn(
                    "text-xs font-mono px-2 py-0.5 rounded-md",
                    isHighlighted
                      ? "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] font-semibold"
                      : "text-[hsl(var(--muted-foreground))]",
                  )}
                >
                  [{index}]
                </span>
              </div>
            );
          })}
        </div>

        {/* Pointers */}
        {pointers.length > 0 && (
          <div className="flex justify-center gap-2 mt-2 mb-4">
            {array.map((_, index) => {
              const pointer = pointers.find((p) => p.index === index);
              return (
                <div key={index} className="w-12 flex justify-center">
                  {pointer && (
                    <div
                      className={cn(
                        "flex flex-col items-center px-2 py-1 rounded-lg border",
                        pointerColors[pointer.color || "blue"],
                      )}
                    >
                      <span className="text-sm">↑</span>
                      <span className="text-xs font-mono font-bold">
                        {pointer.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <div className="px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
          <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}
