"use client";

import { CanvasSpace } from "@tambo-ai/ui-registry/components/canvas-space";
import { Graph, graphSchema } from "@tambo-ai/ui-registry/components/graph";
import { MessageThreadPanel } from "@tambo-ai/ui-registry/components/message-thread-panel";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const CanvasChatInterface = () => {
  const { registerComponent, thread } = useTambo();

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

      Example data structure:
      {
        type: "bar",
        labels: ["Jan", "Feb", "Mar"], // Required array of strings
        datasets: [                    // Required array of datasets
          {
            label: "Sales",           // Required string
            data: [30, 45, 60]       // Required array of numbers (same length as labels)
          }
        ]
      }

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
  }, [registerComponent, thread.id]);

  return (
    <div className="rounded-lg border border-border/40 h-full relative flex flex-row overflow-hidden">
      <CanvasSpace className="bg-background rounded-l-lg flex-1" />
      <MessageThreadPanel className="right rounded-r-lg" />
    </div>
  );
};
