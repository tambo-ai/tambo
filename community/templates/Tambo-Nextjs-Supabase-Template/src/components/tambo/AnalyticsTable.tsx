'use client';

import { z } from 'zod';

/**
 * Zod schema for the AnalyticsTable props.
 * Used by Tambo AI to generate appropriate props based on tool output.
 */
export const AnalyticsTableSchema = z.object({
  records: z.array(z.object({
    id: z.string(),
    label: z.string().describe('The name or label of the analytics record'),
    value: z.number().describe('The numeric value of the record'),
    category: z.string().describe('The category grouping for this record (e.g., sales, users, traffic)'),
    created_at: z.string().describe('ISO timestamp of when the record was created'),
  })).describe('List of analytics records to display in the table'),
});

export type AnalyticsTableProps = z.infer<typeof AnalyticsTableSchema>;

/**
 * AnalyticsTable Generative Component
 * A clean, responsive table for displaying analytics data.
 */
export function AnalyticsTable({ records }: AnalyticsTableProps) {
  if (!records || records.length === 0) {
    return (
      <div className="analytics-empty" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>No analytics records found.</p>
      </div>
    );
  }

  return (
    <div className="analytics-table-container">
      <table className="analytics-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Value</th>
            <th>Category</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.label}</td>
              <td className="value">{record.value.toLocaleString()}</td>
              <td><span className="badge">{record.category}</span></td>
              <td className="date">{new Date(record.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .analytics-table-container {
          width: 100%;
          overflow-x: auto;
          margin: 1rem 0;
          background: var(--card-bg);
          border-radius: 0.5rem;
          border: 1px solid var(--border);
        }

        .analytics-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.875rem;
        }

        .analytics-table th {
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.02);
          border-bottom: 2px solid var(--border);
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .analytics-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .analytics-table tr:last-child td {
          border-bottom: none;
        }

        .analytics-table .value {
          font-weight: 600;
          color: var(--primary);
        }

        .analytics-table .badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .analytics-table .date {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
