"use client";

import { cn } from "@/lib/utils";
import { z } from "zod";
import { Table2 } from "lucide-react";

/**
 * Schema for DPTable props
 * Used by Tambo to validate and generate props
 */
export const dpTableSchema = z.object({
  title: z.string().describe("Title describing the DP problem"),
  table: z
    .array(z.array(z.number().or(z.string())))
    .describe("2D array representing the DP table values"),
  rowLabels: z
    .array(z.string())
    .optional()
    .describe("Labels for each row (e.g., item names, weights)"),
  colLabels: z
    .array(z.string())
    .optional()
    .describe("Labels for each column (e.g., capacities, indices)"),
  highlightCells: z
    .array(
      z.object({
        row: z.number().describe("Row index of the cell to highlight"),
        col: z.number().describe("Column index of the cell to highlight"),
        color: z
          .enum(["blue", "green", "red", "yellow"])
          .optional()
          .describe("Highlight color"),
      })
    )
    .optional()
    .describe("Cells to highlight showing the DP transition path"),
  caption: z
    .string()
    .optional()
    .describe("Explanation of the DP table or current transition"),
});

export type DPTableProps = z.infer<typeof dpTableSchema>;

const cellHighlightColors = {
  blue: "bg-blue-500/20 border-blue-400 text-blue-300",
  green: "bg-emerald-500/20 border-emerald-400 text-emerald-300",
  red: "bg-red-500/20 border-red-400 text-red-300",
  yellow: "bg-amber-500/20 border-amber-400 text-amber-300",
};

/**
 * DPTable Component
 *
 * Renders a 2D dynamic programming table with optional highlighting.
 * Used for visualizing DP problems like knapsack, LCS, edit distance, etc.
 */
export function DPTable({
  title,
  table,
  rowLabels,
  colLabels,
  highlightCells = [],
  caption,
}: DPTableProps) {
  const isHighlighted = (row: number, col: number) =>
    highlightCells.find((c) => c.row === row && c.col === col);

  return (
    <div className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-[hsl(var(--primary))]" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
          {table?.length || 0} × {table?.[0]?.length || 0}
        </span>
      </div>

      {/* Table */}
      <div className="p-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              {colLabels && (
                <tr>
                  {rowLabels && <th className="w-16" />}
                  {colLabels.map((label, i) => (
                    <th
                      key={i}
                      className="px-4 py-2 text-xs font-mono font-semibold text-[hsl(var(--muted-foreground))] text-center"
                    >
                      <span className="px-2 py-1 rounded-md bg-[hsl(var(--muted))]">
                        {label}
                      </span>
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {table?.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {rowLabels && (
                    <td className="px-3 py-2 text-xs font-mono font-semibold text-[hsl(var(--muted-foreground))] text-right">
                      <span className="px-2 py-1 rounded-md bg-[hsl(var(--muted))]">
                        {rowLabels[rowIndex]}
                      </span>
                    </td>
                  )}
                  {row.map((cell, colIndex) => {
                    const highlight = isHighlighted(rowIndex, colIndex);
                    return (
                      <td
                        key={colIndex}
                        className={cn(
                          "px-4 py-3 text-center text-sm font-mono border border-[hsl(var(--border))]/30 transition-all",
                          highlight
                            ? cn(
                                cellHighlightColors[highlight.color || "blue"],
                                "border-2 font-bold"
                              )
                            : "bg-[hsl(var(--background))]/50 hover:bg-[hsl(var(--muted))]/50"
                        )}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend for highlights */}
        {highlightCells.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-blue-500/20 border-2 border-blue-400" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Current cell</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-emerald-500/20 border-2 border-emerald-400" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Optimal path</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-amber-500/20 border-2 border-amber-400" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Subproblem</span>
            </div>
          </div>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <div className="px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
          <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]" />
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}
