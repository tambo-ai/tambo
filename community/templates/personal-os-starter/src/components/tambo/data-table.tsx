"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod";

/**
 * Zod schema for DataTable
 */
export const dataTableSchema = z.object({
  title: z.string().describe("Title of the table"),
  columns: z
    .array(
      z.object({
        key: z.string(),
        header: z.string(),
      }),
    )
    .describe("Column definitions"),
  data: z
    .string()
    .describe(
      'JSON stringified array of data objects. Example: \'[{"id": 1, "name": "John"}]\'',
    ),
  className: z.string().optional().describe("Optional CSS class"),
});

export type DataTableProps = z.infer<typeof dataTableSchema>;

/**
 * A simple data table component
 */
export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ title, columns, data, className }, ref) => {
    // Parse data if it's a string, ensuring graceful fallback
    const parsedData = React.useMemo(() => {
      try {
        return typeof data === "string" ? JSON.parse(data) : [];
      } catch (e) {
        console.error("Failed to parse DataTable data:", e);
        return [];
      }
    }, [data]);

    return (
      <div
        ref={ref}
        className={cn("w-full border rounded-lg overflow-hidden", className)}
      >
        {title && (
          <div className="bg-muted p-4 font-medium border-b">{title}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-6 py-3 font-medium">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(parsedData) &&
                parsedData.map((row: any, i: number) => (
                  <tr
                    key={i}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    {columns.map((col) => (
                      <td key={`${i}-${col.key}`} className="px-6 py-4">
                        {String(row[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);
DataTable.displayName = "DataTable";
