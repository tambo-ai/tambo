import * as React from "react";
import type { GraphData, GraphDataState } from "./validate-graph-data";

/**
 * Context value shared among Graph primitive sub-components.
 */
export interface GraphRootContextValue {
  /** The raw graph data passed to the root component. */
  data: GraphData | undefined;
  /** The result of validating the graph data. */
  dataState: GraphDataState;
  /** The title of the graph. */
  title: string;
  /** Whether to show the chart legend. */
  showLegend: boolean;
}

const GraphRootContext = React.createContext<GraphRootContextValue | null>(
  null,
);

/**
 * Hook to access the graph root context.
 * @internal This hook is for internal use by base components only.
 * @returns The graph root context value
 * @throws Error if used outside of Graph.Root component
 */
function useGraphRootContext(): GraphRootContextValue {
  const context = React.useContext(GraphRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: GraphRootContext is missing. Graph parts must be used within <Graph.Root>",
    );
  }
  return context;
}

export { GraphRootContext, useGraphRootContext };
