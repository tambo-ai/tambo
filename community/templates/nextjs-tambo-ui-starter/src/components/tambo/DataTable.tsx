import React from "react";
import { z } from "zod";

export const DataTablePropsSchema = z.object({
  title: z.string().default("Data Table"),
  rows: z
    .array(
      z.object({
        name: z.string().default("Item"),
        value: z.string().default("Value"),
        status: z.string().default("Active"),
      }),
    )
    .default([]),
});

export type DataTableProps = z.infer<typeof DataTablePropsSchema>;

export function DataTableComponent({
  title = "Data Table",
  rows = [],
}: DataTableProps): React.ReactElement {
  // Safely process rows
  const safeRows = Array.isArray(rows)
    ? rows
        .filter((row) => row != null)
        .map((row) => ({
          name: String(row.name || "Unnamed"),
          value: String(row.value || "N/A"),
          status: String(row.status || "Active"),
        }))
    : [];

  const safeTitle = String(title || "Data Table");

  if (safeRows.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <div className="mb-3 text-gray-400">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-semibold text-gray-600">
          {safeTitle}
        </h3>
        <p className="text-gray-500">
          No data available. Ask the AI to generate specific data.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden">
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{safeTitle}</h3>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            {safeRows.length} items
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {safeRows.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {row.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">
                    {row.value}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      row.status.toLowerCase().includes("active") ||
                      row.status.toLowerCase().includes("high") ||
                      row.status.toLowerCase().includes("success")
                        ? "bg-green-100 text-green-800"
                        : row.status.toLowerCase().includes("inactive") ||
                            row.status.toLowerCase().includes("low")
                          ? "bg-gray-100 text-gray-800"
                          : row.status.toLowerCase().includes("pending") ||
                              row.status.toLowerCase().includes("medium") ||
                              row.status.toLowerCase().includes("warning")
                            ? "bg-amber-100 text-amber-800"
                            : row.status.toLowerCase().includes("error")
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {safeRows.length > 5 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
          <div className="text-xs text-gray-600">
            Showing {safeRows.length} items
          </div>
        </div>
      )}
    </div>
  );
}

export const DataTable = {
  name: "DataTable",
  description:
    "Display tabular data with rows containing name, value, and status fields.",
  component: DataTableComponent,
  propsSchema: DataTablePropsSchema,
};
