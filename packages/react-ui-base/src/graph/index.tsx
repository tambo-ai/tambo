"use client";

import { GraphChart } from "./chart/graph-chart";
import { GraphErrorBoundary } from "./error-boundary/graph-error-boundary";
import { GraphLoading } from "./loading/graph-loading";
import { GraphRoot } from "./root/graph-root";
import { GraphTitle } from "./title/graph-title";

/**
 * Graph namespace containing all graph base components.
 */
const Graph = {
  Root: GraphRoot,
  Title: GraphTitle,
  Chart: GraphChart,
  Loading: GraphLoading,
  ErrorBoundary: GraphErrorBoundary,
};

export type {
  GraphChartProps,
  GraphChartRenderProps,
} from "./chart/graph-chart";
export type { GraphErrorBoundaryProps } from "./error-boundary/graph-error-boundary";
export type {
  GraphLoadingProps,
  GraphLoadingRenderProps,
  GraphLoadingStatus,
} from "./loading/graph-loading";
export type { GraphRootContextValue } from "./root/graph-root-context";
export type { GraphRootProps } from "./root/graph-root";
export type {
  GraphData,
  GraphDataset,
  GraphDataState,
} from "./root/validate-graph-data";
export { validateGraphData } from "./root/validate-graph-data";
export type {
  GraphTitleProps,
  GraphTitleRenderProps,
} from "./title/graph-title";

export { Graph };
