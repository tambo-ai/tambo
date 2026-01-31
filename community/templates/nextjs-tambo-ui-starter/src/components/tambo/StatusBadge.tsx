import React from 'react';
import { z } from 'zod';

export const StatusBadgePropsSchema = z.object({
  label: z.string().default('Status'),
  status: z.enum(['success', 'warning', 'error', 'info']).default('success'),
  description: z.string().optional().default(''),
});

const validStatuses = ['success', 'warning', 'error', 'info'] as const;
type ValidStatus = (typeof validStatuses)[number];

// Check if the status is valid using type guard
function isValidStatus(status: string): status is ValidStatus {
  return validStatuses.includes(status as ValidStatus);
}

export type StatusBadgeProps = z.infer<typeof StatusBadgePropsSchema>;

export function StatusBadgeComponent({
  label = 'Status',
  status = 'success',
  description = '',
}: StatusBadgeProps): React.ReactElement {
  // Safely handle all inputs
  const safeLabel = String(label || 'Status');
  const safeDescription = description ? String(description) : '';

  // Validate status using type guard
  const lowerStatus = String(status).toLowerCase();
  const safeStatus = isValidStatus(lowerStatus) ? lowerStatus : 'info';

  const statusConfig = {
    success: {
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    warning: {
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    error: {
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    info: {
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  };

  const selectedStatus = statusConfig[safeStatus];

  return (
    <div
      className={`inline-flex flex-col rounded-lg border ${selectedStatus.borderColor} ${selectedStatus.bgColor} px-3 py-2`}
    >
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${selectedStatus.color.replace('text', 'bg')}`}></div>
        <span className={`font-medium ${selectedStatus.color}`}>{safeLabel}</span>
      </div>
      {safeDescription && <div className="mt-1 text-sm text-gray-600">{safeDescription}</div>}
    </div>
  );
}

export const StatusBadge = {
  name: 'StatusBadge',
  description:
    'Display a status indicator. Use for showing system status, deployment status, or alerts.',
  component: StatusBadgeComponent,
  propsSchema: StatusBadgePropsSchema,
};
