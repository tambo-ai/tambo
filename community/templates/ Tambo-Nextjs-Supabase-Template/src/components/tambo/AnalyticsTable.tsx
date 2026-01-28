"use client";

import { z } from "zod";
import "./AnalyticsTable.css";

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

/**
 * AnalyticsTable Generative Component
 * A clean, responsive table for displaying analytics data.
 */
export function AnalyticsTable({ records }: AnalyticsTableProps) {
  if (!records || records.length === 0) {
    return (
      <div className="analytics-empty">
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
              <td className="label-cell">{record.label}</td>
              <td className="value-cell">{record.value.toLocaleString()}</td>
              <td className="category-cell">
                <span className={`badge ${record.category.toLowerCase()}`}>
                  {record.category}
                </span>
              </td>
              <td className="date-cell">
                {new Date(record.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
