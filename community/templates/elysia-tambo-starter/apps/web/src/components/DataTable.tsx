import { Table as TableIcon } from "lucide-react";

interface DataTableProps {
  title?: string;
  columns: string[];
  rows: (string | number | boolean)[][];
}

export function DataTable({
  title = "Data View",
  columns = [],
  rows = [],
}: DataTableProps) {
  return (
    <div className="p-6 border border-slate-200/60 rounded-2xl bg-white shadow-sm w-full max-w-2xl overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-xl text-slate-900 border border-slate-100">
            <TableIcon className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-sm tracking-tight text-slate-900">
            {title}
          </h3>
        </div>
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          {rows.length} Rows
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row, i) => (
              <tr
                key={i}
                className="hover:bg-slate-50/50 transition-colors group"
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-4 py-3 text-sm text-slate-600 font-medium"
                  >
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end">
        <p className="text-[10px] font-medium text-slate-300 italic">
          Rendered via ChatBot Data Engine
        </p>
      </div>
    </div>
  );
}
