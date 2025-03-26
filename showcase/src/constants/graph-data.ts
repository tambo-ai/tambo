export const sampleGraphData = {
  type: "bar" as const,
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [
    {
      label: "Sales",
      data: [65, 59, 80, 81, 56],
    },
    {
      label: "Revenue",
      data: [28, 48, 40, 19, 86],
    },
  ],
};
