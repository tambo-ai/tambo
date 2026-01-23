import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useRef } from "react";
import { z } from "zod";

export const DataTableViewerPropsSchema = z.object({
  data: z
    .array(z.any())
    .describe("The array of data objects to be displayed in the table."),
  columns: z
    .array(
      z.object({
        accessorKey: z
          .string()
          .describe("The key in the data object this column corresponds to."),
        header: z.string().describe("The display name for the column header."),
      }),
    )
    .describe("An array of column definitions."),
});

export type DataTableViewerProps = z.infer<typeof DataTableViewerPropsSchema>;

/**
 * A high-performance virtualized data table component for displaying large datasets.
 */
export const DataTableViewer: React.FC<DataTableViewerProps> = ({
  data,
  columns,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();
  const headerGroups = table.getHeaderGroups(); // Added as per Vercel bot suggestion

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      className="h-[500px] overflow-auto border rounded-md border-zinc-800 bg-zinc-950"
    >
      {/* Sticky Header - Ensures labels stay at the top during scroll */}
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800">
        {headerGroups.map((headerGroup) => (
          <div key={headerGroup.id} className="flex">
            {headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className="flex-1 p-2 text-sm font-semibold text-zinc-100"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Virtualized Rows Container */}
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full flex border-b border-zinc-800 hover:bg-zinc-900/50"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  className="flex-1 p-2 text-sm text-zinc-300 truncate"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
