import { DataTable } from "@/components/DataTable";
import { FiltersPanel, type FilterState } from "@/components/FiltersPanel";
import { Graph } from "@/components/Graph";
import { SummaryCard } from "@/components/SummaryCard";
import { salesData } from "@/data/sales";
import { z } from "zod";

const graphPropsSchema = z.object({
  data: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
    }),
  ),
  type: z.enum(["line", "bar", "pie"]),
  title: z.string().optional(),
});

const summaryCardPropsSchema = z.object({
  title: z.string(),
  value: z.union([z.string(), z.number()]),
  description: z.string().optional(),
});

const dataTablePropsSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(
    z
      .object({
        date: z.union([z.string(), z.number()]).optional(),
        region: z.union([z.string(), z.number()]).optional(),
        category: z.union([z.string(), z.number()]).optional(),
        product: z.union([z.string(), z.number()]).optional(),
        revenue: z.union([z.string(), z.number()]).optional(),
        name: z.union([z.string(), z.number()]).optional(),
        value: z.union([z.string(), z.number()]).optional(),
      })
      .passthrough(),
  ),
});

const filtersPanelPropsSchema = z.object({
  onFiltersChange: z.function().args(z.unknown()).returns(z.void()),
  initialFilters: z
    .object({
      region: z.string(),
      category: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    })
    .optional(),
});

export const components = {
  Graph: {
    component: Graph,
    propsSchema: graphPropsSchema,
    description: `Renders a chart visualization (bar, line, or pie chart) for analytics data. 
    Use this to display aggregated revenue data by region, category, product, or time period.
    The data prop expects an array of {name: string, value: number} objects.
    
    The user may have uploaded their own CSV data - check the dataset context helper for the current data source.`,
  },
  SummaryCard: {
    component: SummaryCard,
    propsSchema: summaryCardPropsSchema,
    description: `Displays a KPI summary card with title, value, and optional description.
    Use this to show key metrics like total revenue, average sales, or counts.
    Format currency values with $ sign and commas (e.g., "$1,234,567").
    
    Calculate metrics from the dataset provided in the context helper.`,
  },
  DataTable: {
    component: DataTable,
    propsSchema: dataTablePropsSchema,
    description: `Renders a table with columns and rows for detailed data display.
    Use this to show raw or filtered sales data with multiple fields.
    The dataset structure is available in the context helper - it may be from uploaded CSV or mock data.
    Common fields include: date, region, category, product, revenue.`,
  },
  FiltersPanel: {
    component: FiltersPanel,
    propsSchema: filtersPanelPropsSchema,
    description: `Interactive filters panel for region, category, and date range selection. 
    State persists across messages. Use this when users want to filter the data view.
    
    SALES DATA CONTEXT:
    The user can upload their own CSV data or use the default mock dataset.
    Check the 'dataset' context helper to see the current data source and available records.
    
    Default mock data structure:
    - Regions: North America, Europe, Asia, India
    - Categories: Electronics, Clothing, Home & Garden
    - Date range: Oct-Dec 2025
    
    When users ask about revenue, products, or comparisons:
    1. Check the dataset context helper for current data
    2. Calculate aggregations from the data (sum revenue by region, category, month, etc.)
    3. Render Graph component with aggregated data
    4. Optionally add SummaryCard for totals
    5. For detailed views, use DataTable with relevant rows
    
    CRITICAL: Always render components with actual calculated data from the dataset context helper. Never just describe what you would show.`,
    interactable: {
      stateSchema: z.object({
        region: z.string(),
        category: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }),
      initialState: {
        region: "",
        category: "",
        startDate: "",
        endDate: "",
      },
      onStateChange: (state: FilterState) => {
        return {
          onFiltersChange: (newFilters: FilterState) => {
            Object.assign(state, newFilters);
          },
          initialFilters: state,
        };
      },
    },
  },
};

export const componentsArray = Object.entries(components).map(
  ([name, config]) => ({
    name,
    ...config,
  }),
);

export const systemPrompt = `You are an AI analytics assistant for a small business dashboard.

CRITICAL: You MUST render components using the component system. DO NOT just describe what you would show - actually render the components.

Here is the complete sales dataset:
${JSON.stringify(salesData, null, 2)}

AVAILABLE COMPONENTS (you must use these):

1. Graph - for charts
   Example: <Graph data={[{name: "North America", value: 450000}, {name: "Europe", value: 380000}]} type="bar" title="Revenue by Region" />

2. SummaryCard - for KPIs
   Example: <SummaryCard title="Total Revenue" value="$1,234,567" description="Last 3 months" />

3. DataTable - for tables
   Example: <DataTable columns={["Month", "Revenue"]} rows={[{Month: "October", Revenue: 500000}, {Month: "November", Revenue: 550000}]} />

4. FiltersPanel - for filtering (interactive)

HOW TO RESPOND:
1. Analyze the sales data above
2. Calculate totals/aggregations as needed
3. RENDER components with actual data - don't just say you will render them
4. Use multiple components if helpful

For "Compare last 3 months":
- Calculate monthly totals from the data
- Render a Graph component with the results
- Optionally add SummaryCard for total

ALWAYS use components to visualize data, NEVER just describe what you would show.`;
