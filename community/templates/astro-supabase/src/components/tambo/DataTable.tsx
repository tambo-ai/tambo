import type { FC } from "react";
import { z } from "zod";

// Define a schema that Tambo can understand - using an array of explicit key-value pairs
export const dataTableSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).optional(),
        name: z.string().optional(),
        email: z.string().optional(),
        created_at: z.string().optional(),
      }),
    )
    .describe("Array of data objects to display in the table"),
  title: z.string().optional().describe("Optional title for the table"),
});

interface DataTableProps {
  data: Array<{ [key: string]: string | number }>;
  title?: string;
}

export const DataTable: FC<DataTableProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
        <div className="inline-flex items-center justify-center w-10 h-10 mb-3 rounded-full bg-gray-100 text-gray-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-500">No data available</p>
        <p className="text-xs text-gray-400 mt-1">
          Add some items to see them here
        </p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
