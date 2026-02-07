/**
 * Represents a single dataset within graph data.
 */
export interface GraphDataset {
  label: string;
  data: number[];
  color?: string;
}

/**
 * Represents the data structure for a graph.
 */
export interface GraphData {
  type: "bar" | "line" | "pie";
  labels: string[];
  datasets: GraphDataset[];
}

/**
 * Describes the validation state of graph data.
 */
export type GraphDataState =
  | { status: "no-data" }
  | { status: "invalid-structure" }
  | { status: "no-valid-datasets" }
  | { status: "unsupported-type"; type: string }
  | {
      status: "valid";
      validDatasets: GraphDataset[];
      maxDataPoints: number;
      chartData: Array<Record<string, string | number>>;
    };

/**
 * Validates graph data and returns the validation state.
 * Handles partial/streaming data gracefully by returning appropriate status.
 * @param data - The graph data to validate, or undefined if not yet available
 * @returns The validation state describing whether the data is usable
 */
export function validateGraphData(data: GraphData | undefined): GraphDataState {
  if (!data) {
    return { status: "no-data" };
  }

  const hasValidStructure =
    data.type &&
    data.labels &&
    data.datasets &&
    Array.isArray(data.labels) &&
    Array.isArray(data.datasets) &&
    data.labels.length > 0 &&
    data.datasets.length > 0;

  if (!hasValidStructure) {
    return { status: "invalid-structure" };
  }

  const validDatasets = data.datasets.filter(
    (dataset) =>
      dataset.label &&
      dataset.data &&
      Array.isArray(dataset.data) &&
      dataset.data.length > 0,
  );

  if (validDatasets.length === 0) {
    return { status: "no-valid-datasets" };
  }

  if (!["bar", "line", "pie"].includes(data.type)) {
    return { status: "unsupported-type", type: data.type };
  }

  const maxDataPoints = Math.min(
    data.labels.length,
    Math.min(...validDatasets.map((d) => d.data.length)),
  );

  const chartData = data.labels.slice(0, maxDataPoints).map((label, index) => ({
    name: label,
    ...Object.fromEntries(
      validDatasets.map((dataset) => [dataset.label, dataset.data[index] ?? 0]),
    ),
  }));

  return {
    status: "valid",
    validDatasets,
    maxDataPoints,
    chartData,
  };
}
