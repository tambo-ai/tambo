// ===== FILE: src/components/tambo/index.ts =====
import { MetricCard } from './MetricCard';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';

// Export the array that Tambo expects
export const components = [
  {
    name: DataTable.name,
    description: DataTable.description,
    component: DataTable.component,
    propsSchema: DataTable.propsSchema,
  },
  {
    name: MetricCard.name,
    description: MetricCard.description,
    component: MetricCard.component,
    propsSchema: MetricCard.propsSchema,
  },
  {
    name: StatusBadge.name,
    description: StatusBadge.description,
    component: StatusBadge.component,
    propsSchema: StatusBadge.propsSchema,
  },
];

// Also export individual components if needed elsewhere
export { MetricCard, StatusBadge, DataTable };
