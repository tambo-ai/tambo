"use client";

import { CanvasSpace } from "@/components/ui/canvas-space";
import { Graph } from "@/components/ui/graph";
import { CarouselView } from "../../../../cli/src/registry/carousel-view";
import { MessageThreadPanel } from "@/components/ui/message-thread-panel";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const CanvasChatInterface = () => {
  const userContextKey = useUserContextKey("canvas-space-thread");
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
      propsDefinition: {
        type: "object",
        properties: {
          data: {
            type: "object",
            description: "The data structure for the graph.",
            properties: {
              type: {
                type: "string",
                enum: ["bar", "line", "pie"],
                description: "The type of graph to display.",
              },
              labels: {
                type: "array",
                description:
                  "Labels for the data points (e.g., x-axis categories).",
                items: { type: "string" },
              },
              datasets: {
                type: "array",
                description: "Array of datasets to plot on the graph.",
                items: {
                  type: "object",
                  properties: {
                    label: {
                      type: "string",
                      description: "Label for this dataset (used in legend).",
                    },
                    data: {
                      type: "array",
                      description: "Numerical data points for this dataset.",
                      items: { type: "number" },
                    },
                    color: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Color(s) for the dataset. Provide an array of colors (e.g., ['hsl(...)', 'hsl(...)']). For pie charts, each color corresponds to a slice. For bar/line charts, typically only the first color in the array is used.",
                    },
                  },
                  required: ["label", "data"],
                },
              },
            },
            required: ["type", "labels", "datasets"],
            example: [
              {
                description: "Bar chart example - Sales and Revenue Comparison",
                data: {
                  type: "bar",
                  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                  datasets: [
                    {
                      label: "Sales",
                      data: [65, 59, 80, 81, 56, 72],
                      color: "hsl(210, 100.00%, 61.60%)",
                    },
                    {
                      label: "Revenue",
                      data: [28, 48, 40, 19, 86, 27],
                      color: "hsl(150, 100.00%, 61.60%)",
                    },
                    {
                      label: "Profit",
                      data: [17, 22, 28, 11, 45, 13],
                      color: "hsl(45, 100.00%, 61.60%)",
                    },
                  ],
                },
                title: "Quarterly Performance",
                variant: "bordered",
                size: "lg",
              },
              {
                description: "Line chart example - Monthly Trends",
                data: {
                  type: "line",
                  labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
                  datasets: [
                    {
                      label: "Website Traffic",
                      data: [1200, 1900, 3000, 4900, 2600],
                      color: "hsl(280, 100.00%, 61.60%)",
                    },
                    {
                      label: "Conversion Rate",
                      data: [12, 19, 27, 30, 24],
                      color: "hsl(340, 100.00%, 61.60%)",
                    },
                  ],
                },
                title: "Website Analytics",
                variant: "solid",
                size: "lg",
              },
              {
                description: "Pie chart example - Market Share",
                data: {
                  type: "pie",
                  labels: ["Product A", "Product B", "Product C", "Product D"],
                  datasets: [
                    {
                      label: "Market Share",
                      data: [45, 25, 20, 10],
                      color: [
                        "hsl(210, 100.00%, 61.60%)",
                        "hsl(150, 100.00%, 61.60%)",
                        "hsl(45, 100.00%, 61.60%)",
                        "hsl(280, 100.00%, 61.60%)",
                      ],
                    },
                  ],
                },
                title: "Product Market Distribution",
                variant: "default",
                size: "lg",
              },
            ],
          },
          title: {
            type: "string",
            description: "Optional title displayed above the graph.",
          },
          showLegend: {
            type: "boolean",
            description: "Whether to display the graph's legend.",
          },
          variant: {
            type: "string",
            enum: ["default", "solid", "bordered"],
            description: "Visual style variant of the graph container.",
            default: "default",
          },
          size: {
            type: "string",
            enum: ["default", "sm", "lg"],
            description: "Size variant of the graph.",
            default: "default",
          },
        },
        required: ["data"],
      },
    });

    registerComponent({
      name: "CarouselView",
      description: `An interactive carousel component that displays mixed media items with navigation and selection capabilities.
      Perfect for showcasing products, galleries, testimonials, or any collection of content.
      
      Features:
      - Touch/swipe support for mobile devices
      - Keyboard navigation (arrow keys, home, end)
      - Auto-play functionality with customizable timing
      - Configurable visible slide count
      - Loop/infinite scroll option
      - Mixed media support (images, videos, custom content)
      - Accessibility features (ARIA labels, screen reader support)
      - Responsive design
      
      Example use cases:
      - Product image galleries
      - Customer testimonials
      - Feature showcases
      - Portfolio displays
      - News/blog post previews
      - Team member profiles
      
      Usage tips:
      1. Use visibleCount=1 for single-item focus (like hero banners)
      2. Use visibleCount=3 for product galleries
      3. Enable autoplay for promotional content
      4. Include media for visual appeal
      5. Keep titles concise and descriptive`,
      component: CarouselView,
      propsDefinition: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description:
              "Array of items to display in the carousel. Each item must have an id and title.",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Unique identifier for the item",
                },
                title: {
                  type: "string",
                  description: "Title or main text for the item",
                },
                description: {
                  type: "string",
                  description: "Optional description or subtitle for the item",
                },
                media: {
                  type: "object",
                  description: "Optional media content for the item",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["image", "video", "icon"],
                      description: "Type of media content",
                    },
                    url: {
                      type: "string",
                      description: "URL to the media content",
                    },
                    alt: {
                      type: "string",
                      description: "Alt text for accessibility",
                    },
                  },
                  required: ["type", "url"],
                },
                data: {
                  type: "object",
                  description: "Additional data associated with the item",
                },
              },
              required: ["id", "title"],
            },
            minItems: 1,
          },
          visibleCount: {
            type: "number",
            description:
              "Number of slides visible at once. Use 1 for single-item view, 2-4 for multi-item galleries.",
            minimum: 1,
            maximum: 6,
            default: 1,
          },
          loop: {
            type: "boolean",
            description: "Whether the carousel should loop infinitely",
            default: false,
          },
          autoplay: {
            type: "boolean",
            description: "Whether the carousel should auto-advance slides",
            default: false,
          },
          autoplayDelay: {
            type: "number",
            description: "Delay between auto-advance in milliseconds",
            minimum: 1000,
            maximum: 10000,
            default: 3000,
          },
        },
        required: ["items"],
        example: [
          {
            description: "Product showcase carousel",
            items: [
              {
                id: "product-1",
                title: "Premium Headphones",
                description:
                  "High-quality wireless headphones with noise cancellation",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
                  alt: "Premium headphones",
                },
              },
              {
                id: "product-2",
                title: "Smart Watch",
                description: "Advanced fitness tracking and notifications",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
                  alt: "Smart watch",
                },
              },
              {
                id: "product-3",
                title: "Wireless Speaker",
                description: "Portable speaker with rich, immersive sound",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
                  alt: "Wireless speaker",
                },
              },
            ],
            visibleCount: 1,
            loop: true,
            autoplay: true,
            autoplayDelay: 4000,
          },
          {
            description: "Team members gallery",
            items: [
              {
                id: "team-1",
                title: "Sarah Johnson",
                description: "Lead Designer",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
                  alt: "Sarah Johnson",
                },
              },
              {
                id: "team-2",
                title: "Mike Chen",
                description: "Senior Developer",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
                  alt: "Mike Chen",
                },
              },
              {
                id: "team-3",
                title: "Emily Rodriguez",
                description: "Product Manager",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
                  alt: "Emily Rodriguez",
                },
              },
            ],
            visibleCount: 3,
            loop: false,
            autoplay: false,
          },
        ],
      },
    });
  }, [registerComponent, thread.id]);

  return (
    <div className="rounded-lg border border-border/40 h-full relative flex flex-row overflow-hidden">
      <CanvasSpace className="bg-background rounded-l-lg" />
      <MessageThreadPanel
        contextKey={userContextKey}
        className="right rounded-r-lg"
        style={{ width: "60%" }}
      />
    </div>
  );
};
