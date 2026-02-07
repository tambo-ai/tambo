import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useGraphRootContext } from "../root/graph-root-context";
import type { GraphDataset } from "../root/validate-graph-data";

/**
 * Props passed to the Graph.Chart render function.
 */
export interface GraphChartRenderProps {
  /** The type of chart to render. */
  chartType: "bar" | "line" | "pie";
  /** Transformed data ready for charting. Each entry has a 'name' key plus dataset label keys. */
  chartData: Array<Record<string, string | number>>;
  /** The validated datasets with their labels, data, and optional colors. */
  validDatasets: GraphDataset[];
  /** Maximum number of data points (minimum of labels length and shortest dataset). */
  maxDataPoints: number;
  /** Whether to show the chart legend. */
  showLegend: boolean;
  /** The raw labels array from the graph data. */
  labels: string[];
}

export type GraphChartProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement>,
  GraphChartRenderProps
>;

/**
 * Chart primitive that provides validated chart data via render props.
 * Only renders when graph data is in a valid state.
 * The actual chart rendering (e.g. with Recharts) is delegated to the render prop or children.
 * @returns The chart container element, or null if data is not valid
 */
export const GraphChart = React.forwardRef<HTMLDivElement, GraphChartProps>(
  function GraphChart({ asChild, ...props }, ref) {
    const { dataState, showLegend, data } = useGraphRootContext();

    if (dataState.status !== "valid" || !data) {
      return null;
    }

    const Comp = asChild ? Slot : "div";

    const { content, componentProps } = useRender(props, {
      chartType: data.type,
      chartData: dataState.chartData,
      validDatasets: dataState.validDatasets,
      maxDataPoints: dataState.maxDataPoints,
      showLegend,
      labels: data.labels,
    });

    return (
      <Comp
        ref={ref}
        data-slot="graph-chart"
        data-chart-type={data.type}
        {...componentProps}
      >
        {content}
      </Comp>
    );
  },
);
