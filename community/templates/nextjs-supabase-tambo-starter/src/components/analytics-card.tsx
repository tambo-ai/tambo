"use client";

import { z } from "zod";

/**
 * Zod schema for the AnalyticsTable props.
 * Used by Tambo AI to generate appropriate props based on tool output.
 */
export const AnalyticsTableSchema = z.object({
  records: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().describe("The name or label of the analytics record"),
        value: z.number().describe("The numeric value of the record"),
        category: z
          .string()
          .describe(
            "The category grouping for this record (e.g., sales, users, traffic)",
          ),
        created_at: z
          .string()
          .describe("ISO timestamp of when the record was created"),
      }),
    )
    .describe("List of analytics records to display in the table"),
});

export type AnalyticsTableProps = z.infer<typeof AnalyticsTableSchema>;

export function AnalyticsTable({ records }: AnalyticsTableProps) {
  if (!records || records.length === 0) {
    return (
      <div className="rounded-md border border-border bg-background px-6 py-8 text-center">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">
          No analytics data available
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-md border border-border bg-background overflow-x-auto">
      <table className="w-full border-collapse text-sm text-foreground">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              Label
            </th>
            <th className="px-4 py-3 text-left text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              Value
            </th>
            <th className="px-4 py-3 text-left text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              Category
            </th>
            <th className="px-4 py-3 text-left text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              Date
            </th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="border-b border-border/60 hover:bg-muted/40 transition-colors"
            >
              {/* Label */}
              <td className="px-4 py-3">
                {record.label}
              </td>

              {/* Value */}
              <td className="px-4 py-3 font-mono">
                {record.value.toLocaleString()}
              </td>

              {/* Category */}
              <td className="px-4 py-3">
                <span
                  className={`
                    inline-flex items-center rounded-sm px-2 py-0.5
                    text-[10px] font-mono tracking-widest uppercase
                    border
                    ${opsCategoryStyles(record.category)}
                  `}
                >
                  {record.category}
                </span>
              </td>

              {/* Date */}
              <td className="px-4 py-3 font-mono text-muted-foreground">
                {new Date(record.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function opsCategoryStyles(category: string) {
  switch (category.toLowerCase()) {
    case "sales":
      return "text-green-400 border-green-400/30 bg-green-400/10";
    case "users":
      return "text-blue-400 border-blue-400/30 bg-blue-400/10";
    case "traffic":
      return "text-amber-400 border-amber-400/30 bg-amber-400/10";
    default:
      return "text-muted-foreground border-border bg-muted/20";
  }
}
