<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { z } from "zod";
  import { Chart, Svg, Axis, Bars, Area, Points, Tooltip, Legend } from "layerchart";
  import { scaleBand, scaleLinear, scaleOrdinal } from "d3-scale";

  // Schema definitions
  const graphDataSchema = z.object({
    type: z.enum(["bar", "line", "pie"]).describe("Type of graph to render"),
    labels: z.array(z.string()).describe("Labels for the graph"),
    datasets: z
      .array(
        z.object({
          label: z.string().describe("Label for the dataset"),
          data: z.array(z.number()).describe("Data points for the dataset"),
          color: z.string().optional().describe("Optional color for the dataset"),
        })
      )
      .describe("Data for the graph"),
  });

  const graphSchema = z.object({
    data: graphDataSchema,
    title: z.string().describe("Title for the chart"),
    showLegend: z.boolean().optional(),
    variant: z.enum(["default", "solid", "bordered"]).optional(),
    size: z.enum(["default", "sm", "lg"]).optional(),
    className: z.string().optional(),
  });

  type GraphProps = z.infer<typeof graphSchema>;

  interface Props extends GraphProps {}

  let { data, title, showLegend = true, variant = "default", size = "default", className }: Props = $props();

  // Default colors
  const defaultColors = [
    "hsl(220, 100%, 62%)",
    "hsl(160, 82%, 47%)",
    "hsl(32, 100%, 62%)",
    "hsl(340, 82%, 66%)",
  ];

  // Size classes
  const sizeClasses = {
    default: "h-64",
    sm: "h-48",
    lg: "h-96",
  };

  // Variant classes
  const variantClasses = {
    default: "bg-background",
    solid: "shadow-lg shadow-zinc-900/10 dark:shadow-zinc-900/20 bg-muted",
    bordered: "border-2 border-border",
  };

  // Transform data for layerchart
  const chartData = $derived(() => {
    if (!data?.labels || !data?.datasets?.length) return [];

    const validDatasets = data.datasets.filter(
      (ds) => ds.label && ds.data && Array.isArray(ds.data) && ds.data.length > 0
    );

    if (validDatasets.length === 0) return [];

    const maxDataPoints = Math.min(
      data.labels.length,
      Math.min(...validDatasets.map((d) => d.data.length))
    );

    return data.labels.slice(0, maxDataPoints).map((label, index) => ({
      name: label,
      ...Object.fromEntries(
        validDatasets.map((dataset) => [dataset.label, dataset.data[index] ?? 0])
      ),
    }));
  });

  const hasValidData = $derived(
    data?.type &&
    data?.labels?.length > 0 &&
    data?.datasets?.length > 0 &&
    chartData().length > 0
  );

  const validDatasets = $derived(
    data?.datasets?.filter(
      (ds) => ds.label && ds.data && Array.isArray(ds.data) && ds.data.length > 0
    ) || []
  );

  // Get max value for y-axis scaling
  const maxValue = $derived(() => {
    if (!validDatasets.length) return 100;
    const allValues = validDatasets.flatMap((ds) => ds.data);
    return Math.max(...allValues) * 1.1;
  });
</script>

<div
  class={cn(
    "w-full rounded-lg overflow-hidden transition-all duration-200",
    variantClasses[variant],
    sizeClasses[size],
    className
  )}
>
  <div class="p-4 h-full">
    {#if title}
      <h3 class="text-lg font-medium mb-4 text-foreground">{title}</h3>
    {/if}

    {#if !data}
      <div class="h-full flex items-center justify-center">
        <div class="flex flex-col items-center gap-2 text-muted-foreground">
          <div class="flex items-center gap-1 h-4">
            <span class="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span class="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.2s]"></span>
            <span class="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.1s]"></span>
          </div>
          <span class="text-sm">Awaiting data...</span>
        </div>
      </div>
    {:else if !hasValidData}
      <div class="h-full flex items-center justify-center">
        <div class="text-muted-foreground text-center">
          <p class="text-sm">Building chart...</p>
        </div>
      </div>
    {:else}
      <div class="w-full h-[calc(100%-2rem)]">
        {#if data.type === "bar"}
          <Chart
            data={chartData()}
            x="name"
            xScale={scaleBand().padding(0.2)}
            y={validDatasets[0]?.label || "value"}
            yScale={scaleLinear().domain([0, maxValue()])}
            padding={{ left: 40, bottom: 30, top: 10, right: 10 }}
          >
            <Svg>
              <Axis placement="left" grid={{ class: "stroke-border" }} />
              <Axis placement="bottom" />
              <Bars class="fill-primary" radius={4} />
            </Svg>
            <Tooltip.Root>
              <Tooltip.Header>{(d: Record<string, unknown>) => d.name}</Tooltip.Header>
              <Tooltip.List>
                {#each validDatasets as dataset, i}
                  <Tooltip.Item
                    label={dataset.label}
                    value={(d: Record<string, unknown>) => d[dataset.label]}
                  />
                {/each}
              </Tooltip.List>
            </Tooltip.Root>
          </Chart>
        {:else if data.type === "line"}
          <Chart
            data={chartData()}
            x="name"
            xScale={scaleBand()}
            y={validDatasets[0]?.label || "value"}
            yScale={scaleLinear().domain([0, maxValue()])}
            padding={{ left: 40, bottom: 30, top: 10, right: 10 }}
          >
            <Svg>
              <Axis placement="left" grid={{ class: "stroke-border" }} />
              <Axis placement="bottom" />
              <Area class="fill-primary/20" line={{ class: "stroke-primary stroke-2" }} />
              <Points class="fill-primary" />
            </Svg>
            <Tooltip.Root>
              <Tooltip.Header>{(d: Record<string, unknown>) => d.name}</Tooltip.Header>
              <Tooltip.List>
                {#each validDatasets as dataset}
                  <Tooltip.Item
                    label={dataset.label}
                    value={(d: Record<string, unknown>) => d[dataset.label]}
                  />
                {/each}
              </Tooltip.List>
            </Tooltip.Root>
          </Chart>
        {:else if data.type === "pie"}
          <!-- Simple pie representation using bars as fallback since layerchart pie is complex -->
          <Chart
            data={chartData()}
            x="name"
            xScale={scaleBand().padding(0.2)}
            y={validDatasets[0]?.label || "value"}
            yScale={scaleLinear().domain([0, maxValue()])}
            padding={{ left: 40, bottom: 30, top: 10, right: 10 }}
          >
            <Svg>
              <Axis placement="left" grid={{ class: "stroke-border" }} />
              <Axis placement="bottom" />
              <Bars class="fill-primary" radius={4} />
            </Svg>
            <Tooltip.Root>
              <Tooltip.Header>{(d: Record<string, unknown>) => d.name}</Tooltip.Header>
              <Tooltip.List>
                {#each validDatasets as dataset}
                  <Tooltip.Item
                    label={dataset.label}
                    value={(d: Record<string, unknown>) => d[dataset.label]}
                  />
                {/each}
              </Tooltip.List>
            </Tooltip.Root>
          </Chart>
        {/if}

        {#if showLegend && validDatasets.length > 0}
          <div class="flex flex-wrap gap-4 justify-center mt-2">
            {#each validDatasets as dataset, i}
              <div class="flex items-center gap-2 text-sm">
                <div
                  class="w-3 h-3 rounded"
                  style="background-color: {dataset.color || defaultColors[i % defaultColors.length]}"
                ></div>
                <span class="text-foreground">{dataset.label}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
