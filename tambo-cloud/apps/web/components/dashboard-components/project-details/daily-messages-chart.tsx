"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Graph } from "@/components/ui/tambo/graph";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { MessageCircleIcon } from "lucide-react";

interface DailyMessagesChartProps {
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

export function DailyMessagesChart({ projectId }: DailyMessagesChartProps) {
  const { data: dailyMessages, isLoading } =
    api.project.getProjectDailyMessages.useQuery(
      { projectId, days: 30 },
      {
        enabled: !!projectId,
      },
    );

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

  // Process chart data: generate 30-day timeline with message counts
  const messagesMap = new Map(
    dailyMessages?.map((item) => [item.date, item.messages]) || [],
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
      "Message activity will appear here once your project starts receiving messages.",
  };

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
              Message activity over the last 30 days
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
              <Graph
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
