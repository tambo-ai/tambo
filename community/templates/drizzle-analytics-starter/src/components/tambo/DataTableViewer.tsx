"use client";

export const DataTableViewer = ({
  data = [],
  title,
}: {
  data?: Record<string, unknown>[];
  title?: string;
}) => {
  if (!data || data.length === 0 || !data[0]) {
    return null;
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="w-full border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
      {title && (
        <div className="px-4 py-2 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 font-bold bg-zinc-900/50">
          {title}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-zinc-900/30 text-zinc-400 border-b border-zinc-800">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-4 py-2.5 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-zinc-900/20 transition-colors">
                {columns.map((c) => (
                  <td key={c} className="px-4 py-2.5 text-zinc-300 font-mono">
                    {row[c] !== null && row[c] !== undefined
                      ? String(row[c])
                      : "-"}
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
