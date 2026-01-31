// ===== FILE: src/components/tambo/ComponentParser.tsx =====
'use client';

import React from 'react';
import { DataTableComponent } from './DataTable';
import { MetricCardComponent } from './MetricCard';
import { StatusBadgeComponent } from './StatusBadge';

export function parseAndRenderComponents(content: string): {
  components: React.ReactNode[];
  textContent: string;
} {
  const components: React.ReactNode[] = [];
  let textContent = content;

  // Parse DataTable components
  const dataTableRegex = /<DataTable\s+title="([^"]+)"\s+rows=\{(\[[^\]]+\])\}\s*\/>/gs;
  let match;
  let componentIndex = 0;

  while ((match = dataTableRegex.exec(content)) !== null) {
    const title = match[1];
    const rowsString = match[2];

    try {
      // Clean up the JSON string
      const cleanedRows = rowsString
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/(\w+):/g, '"$1":'); // Add quotes to property names if missing

      const rows = JSON.parse(cleanedRows);

      components.push(
        <DataTableComponent key={`datatable-${componentIndex++}`} title={title} rows={rows} />
      );

      // Remove the component tag from text content
      textContent = textContent.replace(match[0], '');
    } catch (e) {
      console.error('Failed to parse DataTable:', e, rowsString);
    }
  }

  // Parse MetricCard components
  const metricCardRegex =
    /<MetricCard\s+title="([^"]+)"\s+value="([^"]+)"\s+trend="(up|down|neutral)"(?:\s+description="([^"]+)")?\s*\/>/gs;

  while ((match = metricCardRegex.exec(content)) !== null) {
    const title = match[1];
    const value = match[2];
    const trend = match[3] as 'up' | 'down' | 'neutral';
    const description = match[4] || '';

    components.push(
      <MetricCardComponent
        key={`metric-${componentIndex++}`}
        title={title}
        value={value}
        trend={trend}
        description={description}
      />
    );

    textContent = textContent.replace(match[0], '');
  }

  // Parse StatusBadge components
  const statusBadgeRegex =
    /<StatusBadge\s+label="([^"]+)"\s+status="(success|warning|error|info)"(?:\s+description="([^"]+)")?\s*\/>/gs;

  while ((match = statusBadgeRegex.exec(content)) !== null) {
    const label = match[1];
    const status = match[2] as 'success' | 'warning' | 'error' | 'info';
    const description = match[3] || '';

    components.push(
      <StatusBadgeComponent
        key={`status-${componentIndex++}`}
        label={label}
        status={status}
        description={description}
      />
    );

    textContent = textContent.replace(match[0], '');
  }

  // Clean up the text content
  textContent = textContent.trim();

  return { components, textContent };
}
