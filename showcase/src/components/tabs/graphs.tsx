import { Graph } from "@/components/ui/graph";

export function GraphsComponent() {
  const revenueData = {
    type: "line" as const,
    labels: Array.from(
      { length: 12 },
      (_, i) =>
        [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][i],
    ),
    datasets: [
      {
        label: "Revenue",
        data: [
          12000, 15000, 13000, 14000, 13500, 15231.89, 16500, 17200, 18000,
          17500, 19000, 20000,
        ],
        color: "hsl(var(--chart-1))",
      },
    ],
  };

  const userActivityData = {
    type: "bar" as const,
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Active Users",
        data: [1200, 1400, 1300, 1450, 1600, 1200, 1100],
        color: "hsl(var(--chart-2))",
      },
      {
        label: "New Users",
        data: [250, 280, 350, 450, 550, 750, 950],
        color: "hsl(var(--chart-3))",
      },
    ],
  };

  const performanceData = {
    type: "line" as const,
    labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
    datasets: [
      {
        label: "CPU",
        data: Array.from(
          { length: 24 },
          () => Math.floor(Math.random() * 30) + 40,
        ),
        color: "hsl(var(--chart-3))",
      },
      {
        label: "Memory",
        data: Array.from(
          { length: 24 },
          () => Math.floor(Math.random() * 20) + 60,
        ),
        color: "hsl(var(--chart-4))",
      },
      {
        label: "Network",
        data: Array.from(
          { length: 24 },
          () => Math.floor(Math.random() * 40) + 30,
        ),
        color: "hsl(var(--chart-5))",
      },
    ],
  };

  const modelUsageData = {
    type: "pie" as const,
    labels: ["GPT-4", "GPT-3.5", "Claude", "Llama", "Custom"],
    datasets: [
      {
        label: "Usage",
        data: [35, 25, 20, 15, 5],
        color: "hsl(var(--chart-1))",
      },
    ],
  };

  return (
    <main className="flex flex-col items-center gap-8 px-[12%]">
      <div className="grid grid-cols-12 gap-4 w-full">
        <div className="col-span-8 p-6 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Revenue Overview</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Monthly revenue trends
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">$20,000</span>
              <span className="text-sm text-emerald-500">+12.3%</span>
            </div>
          </div>
          <Graph data={revenueData} variant="bordered" className="h-[400px]" />
        </div>

        <div className="col-span-4 p-6 border rounded-lg bg-card">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Model Distribution</h2>
            <p className="text-sm text-muted-foreground mt-1">
              API calls by model
            </p>
          </div>
          <Graph
            data={modelUsageData}
            variant="bordered"
            className="h-[400px]"
          />
        </div>

        <div className="col-span-12 md:col-span-6 p-6 border rounded-lg bg-card">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">User Activity</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Weekly active vs new users
            </p>
          </div>
          <Graph
            data={userActivityData}
            variant="bordered"
            className="h-[400px]"
          />
        </div>

        <div className="col-span-12 md:col-span-6 p-6 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">System Performance</h2>
              <p className="text-sm text-muted-foreground mt-1">
                24-hour metrics
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-3))]" />
                <span>CPU</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-4))]" />
                <span>Memory</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-5))]" />
                <span>Network</span>
              </div>
            </div>
          </div>
          <Graph
            data={performanceData}
            variant="bordered"
            className="h-[400px]"
          />
        </div>
      </div>
    </main>
  );
}
