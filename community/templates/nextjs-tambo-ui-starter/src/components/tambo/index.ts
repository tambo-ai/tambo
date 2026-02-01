import { MetricCard } from "./MetricCard";
import { StatusBadge } from "./StatusBadge";
import { DataTable } from "./DataTable";

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

export { MetricCard, StatusBadge, DataTable };
