import { Graph, graphSchema } from "@tambo-ai/ui-registry/components/graph";
import { MessageThreadFull } from "@tambo-ai/ui-registry/components/message-thread-full";
import type { Suggestion } from "@tambo-ai/react";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

const graphThreadSuggestions = [
  {
    id: "graph-suggestion-1",
    title: "Create bar chart",
    detailedSuggestion: "Create a bar chart of monthly revenue for Q1.",
    messageId: "graph-bar-chart",
  },
  {
    id: "graph-suggestion-2",
    title: "Switch to line",
    detailedSuggestion:
      "Switch that data to a line chart to highlight trend changes.",
    messageId: "graph-line-chart",
  },
  {
    id: "graph-suggestion-3",
    title: "Show channel split",
    detailedSuggestion:
      "Create a pie chart for traffic channels: organic, paid, and referral.",
    messageId: "graph-pie-chart",
  },
] satisfies Suggestion[];

export const GraphChatInterface = () => {
  const { registerComponent, currentThreadId } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "Graph",
      description: `A versatile data visualization component that supports multiple chart types.
      It can create bar charts, line charts, and pie charts with customizable styles and layouts.
      The component handles data formatting, legends, tooltips, and responsive sizing.
      
      IMPORTANT: The data structure must always include both 'labels' and 'datasets' arrays.
      - labels: An array of strings for the x-axis or categories
      - datasets: An array of objects, each with a 'label' and 'data' array
      - The length of each dataset's 'data' array must match the length of the 'labels' array

      Features:
      - Multiple chart types (bar, line, pie)
      - Customizable colors and styles
      - Interactive tooltips
      - Responsive design
      - Legend support
      - Dark mode support
      
      Example use cases:
      - Sales data visualization
      - Analytics dashboards
      - Performance metrics
      - Trend analysis
      - Data comparisons
      
      Usage tips:
      1. Use bar charts for comparing categories
      2. Use line charts for trends over time
      3. Use pie charts for showing proportions (best with 2-5 values)
      4. When switching chart types, keep the same data structure`,
      component: Graph,
      propsSchema: graphSchema,
    });
  }, [registerComponent, currentThreadId]);

  return (
    <div className="flex flex-col" style={{ height: "700px" }}>
      <MessageThreadFull
        className="rounded-lg"
        initialSuggestions={graphThreadSuggestions}
      />
    </div>
  );
};
