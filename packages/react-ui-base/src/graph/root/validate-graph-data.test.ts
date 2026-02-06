import { validateGraphData } from "./validate-graph-data";
import type { GraphData } from "./validate-graph-data";

describe("validateGraphData", () => {
  it("returns no-data when data is undefined", () => {
    expect(validateGraphData(undefined)).toEqual({ status: "no-data" });
  });

  it("returns invalid-structure when data has no labels", () => {
    const data = {
      type: "bar",
      labels: [],
      datasets: [{ label: "A", data: [1] }],
    } as GraphData;
    expect(validateGraphData(data)).toEqual({ status: "invalid-structure" });
  });

  it("returns invalid-structure when data has no datasets", () => {
    const data = {
      type: "bar",
      labels: ["Jan"],
      datasets: [],
    } as GraphData;
    expect(validateGraphData(data)).toEqual({ status: "invalid-structure" });
  });

  it("returns no-valid-datasets when datasets have no data", () => {
    const data: GraphData = {
      type: "bar",
      labels: ["Jan"],
      datasets: [{ label: "A", data: [] }],
    };
    expect(validateGraphData(data)).toEqual({ status: "no-valid-datasets" });
  });

  it("returns no-valid-datasets when datasets have no label", () => {
    const data: GraphData = {
      type: "bar",
      labels: ["Jan"],
      datasets: [{ label: "", data: [1] }],
    };
    expect(validateGraphData(data)).toEqual({ status: "no-valid-datasets" });
  });

  it("returns unsupported-type for unknown chart types", () => {
    const data = {
      type: "radar" as "bar",
      labels: ["Jan"],
      datasets: [{ label: "A", data: [1] }],
    };
    expect(validateGraphData(data)).toEqual({
      status: "unsupported-type",
      type: "radar",
    });
  });

  it("returns valid for bar chart with proper data", () => {
    const data: GraphData = {
      type: "bar",
      labels: ["Jan", "Feb", "Mar"],
      datasets: [
        { label: "Sales", data: [100, 200, 300] },
        { label: "Revenue", data: [150, 250, 350] },
      ],
    };
    const result = validateGraphData(data);
    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(result.validDatasets).toHaveLength(2);
      expect(result.maxDataPoints).toBe(3);
      expect(result.chartData).toEqual([
        { name: "Jan", Sales: 100, Revenue: 150 },
        { name: "Feb", Sales: 200, Revenue: 250 },
        { name: "Mar", Sales: 300, Revenue: 350 },
      ]);
    }
  });

  it("returns valid for line chart", () => {
    const data: GraphData = {
      type: "line",
      labels: ["Q1", "Q2"],
      datasets: [{ label: "Growth", data: [10, 20] }],
    };
    const result = validateGraphData(data);
    expect(result.status).toBe("valid");
  });

  it("returns valid for pie chart", () => {
    const data: GraphData = {
      type: "pie",
      labels: ["A", "B"],
      datasets: [{ label: "Share", data: [60, 40] }],
    };
    const result = validateGraphData(data);
    expect(result.status).toBe("valid");
  });

  it("uses minimum length between labels and datasets", () => {
    const data: GraphData = {
      type: "bar",
      labels: ["Jan", "Feb"],
      datasets: [{ label: "Sales", data: [100, 200, 300] }],
    };
    const result = validateGraphData(data);
    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(result.maxDataPoints).toBe(2);
      expect(result.chartData).toHaveLength(2);
    }
  });

  it("filters out invalid datasets", () => {
    const data: GraphData = {
      type: "bar",
      labels: ["Jan"],
      datasets: [
        { label: "Valid", data: [100] },
        { label: "", data: [200] },
        { label: "AlsoValid", data: [300] },
      ],
    };
    const result = validateGraphData(data);
    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(result.validDatasets).toHaveLength(2);
      expect(result.validDatasets[0].label).toBe("Valid");
      expect(result.validDatasets[1].label).toBe("AlsoValid");
    }
  });

  it("handles missing data points with fallback to 0", () => {
    const data: GraphData = {
      type: "bar",
      labels: ["Jan"],
      datasets: [{ label: "Sales", data: [100] }],
    };
    const result = validateGraphData(data);
    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(result.chartData[0]).toEqual({ name: "Jan", Sales: 100 });
    }
  });

  it("preserves dataset colors", () => {
    const data: GraphData = {
      type: "bar",
      labels: ["Jan"],
      datasets: [{ label: "Sales", data: [100], color: "#ff0000" }],
    };
    const result = validateGraphData(data);
    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(result.validDatasets[0].color).toBe("#ff0000");
    }
  });
});
