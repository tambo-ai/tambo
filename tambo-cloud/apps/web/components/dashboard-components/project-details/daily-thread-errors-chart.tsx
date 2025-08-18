"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { AlertCircleIcon } from "lucide-react";
import { DashboardGraph } from "./dashboard-graph";

interface DailyThreadErrorsChartProps {
  projectId: string;
}

const formatDate = (dateString: string, format: "chart" | "header"): string => {
  const date = new Date(dateString);

  switch (format) {
    case "chart":
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    case "header":
      return date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    default:
      return dateString;
  }
};

export function DailyThreadErrorsChart({
  projectId,
}: DailyThreadErrorsChartProps) {
  const { data: dailyErrors, isLoading } =
    api.project.getProjectDailyThreadErrors.useQuery(
      { projectId, days: 30 },
      {
        enabled: !!projectId,
      },
    );

  if (isLoading) {
    return (
      <Card className="border border-none bg-transparent overflow-hidden shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Thread Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Process chart data: generate 30-day timeline with error counts
  const errorsMap = new Map(
    dailyErrors?.map((item) => [item.date, item.errors]) || [],
  );

  // Create labels and data arrays for the Graph component
  const labels: string[] = [];
  const data: number[] = [];

  Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateString = date.toISOString().split("T")[0];
    const formattedDate = formatDate(dateString, "chart");

    labels.push(formattedDate);
    data.push(errorsMap.get(dateString) || 0);
  });

  // Transform data for the new Graph component
  const graphData = {
    type: "line" as const,
    labels,
    datasets: [
      {
        label: "Thread Errors",
        data,
        color: "hsl(var(--chart-6))",
      },
    ],
  };

  const emptyState = {
    icon: <AlertCircleIcon className="w-6 h-6" />,
    title: "No errors yet",
    description:
      "This is great! Thread error data will appear here if any issues occur.",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-none bg-transparent overflow-hidden shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Thread Errors</CardTitle>
            <p className="text-sm text-muted-foreground">
              Error activity over the last 30 days
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Data as of {formatDate(new Date().toISOString(), "header")}
          </p>
        </CardHeader>
        <CardContent>
          <DashboardGraph
            data={graphData}
            variant="default"
            size="default"
            showLegend={false}
            className="h-72"
            emptyState={emptyState}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
