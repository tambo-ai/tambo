"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A bar chart with a custom label";

interface ChartBarData {
  User: string;
  Posts: number;
}

const chartConfig = {
  User: {
    label: "User",
    color: "hsl(var(--chart-2))",
  },
  Posts: {
    label: "Posts",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

type ChartBarLabelCustomProps =
  | ChartBarData
  | {
      data: ChartBarData[];
      title?: string;
      description?: string;
    };

export function ChartBarLabelCustom(props: ChartBarLabelCustomProps) {
  const data = "data" in props ? props.data : [props];
  const title = "data" in props ? props.title : undefined;
  const descriptionText = "data" in props ? props.description : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? "Average Post Per User"}</CardTitle>
        <CardDescription>{descriptionText ?? "6 months"}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="User"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="Posts"
              layout="vertical"
              fill="var(--color-Posts)"
              radius={4}
            >
              <LabelList
                dataKey="User"
                position="insideLeft"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
              <LabelList
                dataKey="Posts"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm"></CardFooter>
    </Card>
  );
}
