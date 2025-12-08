"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { MessageCircleIcon } from "lucide-react";
import { z } from "zod/v3";
import { DashboardGraph } from "./dashboard-graph";

export const DailyMessagesChartSchema = z.object({
  projectIds: z
    .union([
      z.string().describe("A single project ID"),
      z.array(z.string()).describe("An array of project IDs"),
    ])
    .describe(
      "The ID(s) of the project(s) to fetch daily messages for. Can be a single ID or an array of IDs.",
    ),
  days: z
    .number()
    .min(1)
    .max(90)
    .default(30)
    .describe("Number of days to display (1-90, default: 30)"),
});

export type DailyMessagesChartProps = z.infer<typeof DailyMessagesChartSchema>;

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

export function DailyMessagesChart({
  projectIds,
  days = 30,
}: DailyMessagesChartProps) {
  // The API now accepts both string and array, so we can pass projectIds directly
  const { data: dailyMessages, isLoading } =
    api.project.getProjectDailyMessages.useQuery(
      { projectId: projectIds, days },
      {
        enabled:
          !!projectIds &&
          (Array.isArray(projectIds) ? projectIds.length > 0 : true),
      },
    );

  // Normalize projectIds to array for UI purposes
  const projectIdArray = Array.isArray(projectIds) ? projectIds : [projectIds];

  if (isLoading) {
    return (
      <Card className="border border-none bg-transparent overflow-hidden shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Daily Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Process chart data
  const messagesMap = new Map(
    dailyMessages?.map((item) => [item.date, item.messages]) || [],
  );

  // Create labels and data arrays for the Graph component
  const labels: string[] = [];
  const data: number[] = [];

  Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateString = date.toISOString().split("T")[0];
    const formattedDate = formatDate(dateString, "chart");

    labels.push(formattedDate);
    data.push(messagesMap.get(dateString) || 0);
  });

  // Transform data for the new Graph component
  const graphData = {
    type: "bar" as const,
    labels,
    datasets: [
      {
        label: "Messages",
        data,
        color: "hsl(var(--chart-6))",
      },
    ],
  };

  const emptyState = {
    icon: <MessageCircleIcon className="w-6 h-6" />,
    title: "No messages yet",
    description:
      projectIdArray.length > 1
        ? "Message activity will appear here once your projects start receiving messages."
        : "Message activity will appear here once your project starts receiving messages.",
  };

  const timeframeText = days === 1 ? "today" : `the last ${days} days`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-none bg-transparent overflow-hidden shadow-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 sm:p-6">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Daily Messages
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Message activity over {timeframeText}
              {projectIdArray.length > 1 &&
                ` (${projectIdArray.length} projects combined)`}
            </p>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Dates as of </span>
            {formatDate(new Date().toISOString(), "header")}
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[400px]">
              <DashboardGraph
                data={graphData}
                variant="default"
                size="default"
                showLegend={false}
                className="h-48 sm:h-64 md:h-72"
                emptyState={emptyState}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
