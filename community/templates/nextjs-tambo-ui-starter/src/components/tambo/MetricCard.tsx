import React from 'react';
import { z } from 'zod';

export const MetricCardPropsSchema = z.object({
  title: z.string().default('Metric'),
  value: z.string().default('0'),
  trend: z.enum(['up', 'down', 'neutral']).default('neutral'),
  description: z.string().optional().default(''),
});

export type MetricCardProps = z.infer<typeof MetricCardPropsSchema>;

export function MetricCardComponent({
  title = 'Metric',
  value = '0',
  trend = 'neutral',
  description = '',
}: MetricCardProps): React.ReactElement {
  // Safely handle all inputs
  const safeTitle = String(title || 'Metric');
  const safeValue = String(value || '0');
  const safeDescription = description ? String(description) : '';

  const trendConfig = {
    up: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: '↑',
    },
    down: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: '↓',
    },
    neutral: {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      icon: '→',
    },
  };

  const selectedTrend = trendConfig[trend];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm text-gray-600">{safeTitle}</div>
          <div className="mt-1 text-2xl font-medium text-gray-900">{safeValue}</div>
          {safeDescription && <div className="mt-2 text-sm text-gray-500">{safeDescription}</div>}
        </div>
        <div
          className={`ml-4 flex h-10 w-10 items-center justify-center rounded ${selectedTrend.bgColor}`}
        >
          <span className={`text-lg font-medium ${selectedTrend.color}`}>{selectedTrend.icon}</span>
        </div>
      </div>
    </div>
  );
}

export const MetricCard = {
  name: 'MetricCard',
  description:
    'Display a metric with value and trend. Use for showing data points like revenue, users, or conversion rates.',
  component: MetricCardComponent,
  propsSchema: MetricCardPropsSchema,
};
