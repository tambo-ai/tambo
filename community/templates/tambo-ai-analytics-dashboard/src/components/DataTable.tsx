import React from 'react';

interface DataTableProps {
    columns: string[];
    rows: Record<string, string | number>[];
}

export const DataTable: React.FC<DataTableProps> = ({ columns, rows }) => {
    return (
        <div className="w-full overflow-x-auto rounded-lg border border-border bg-background">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-border bg-muted">
                        {columns.map((column) => (
                            <th
                                key={column}
                                className="px-4 py-3 text-left text-sm font-semibold text-foreground"
                            >
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-border last:border-b-0">
                            {columns.map((column) => (
                                <td key={column} className="px-4 py-3 text-sm text-foreground">
                                    {row[column]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
