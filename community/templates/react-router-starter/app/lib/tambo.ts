import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { Graph, graphSchema } from "@/components/tambo/graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import {
	getCountryPopulations,
	getGlobalPopulationTrend,
} from "@/services/population-stats";

export const tools: TamboTool[] = [
	{
		name: "countryPopulation",
		description:
			"A tool to get population statistics by country with advanced filtering options",
		tool: getCountryPopulations,
		inputSchema: z.object({
			continent: z.string().optional(),
			sortBy: z.enum(["population", "growthRate"]).optional(),
			limit: z.number().optional(),
			order: z.enum(["asc", "desc"]).optional(),
		}),
		outputSchema: z.array(
			z.object({
				countryCode: z.string(),
				countryName: z.string(),
				continent: z.enum([
					"Asia",
					"Africa",
					"Europe",
					"North America",
					"South America",
					"Oceania",
				]),
				population: z.number(),
				year: z.number(),
				growthRate: z.number(),
			}),
		),
	},
	{
		name: "globalPopulation",
		description:
			"A tool to get global population trends with optional year range filtering",
		tool: getGlobalPopulationTrend,
		inputSchema: z.object({
			startYear: z.number().optional(),
			endYear: z.number().optional(),
		}),
		outputSchema: z.array(
			z.object({
				year: z.number(),
				population: z.number(),
				growthRate: z.number(),
			}),
		),
	},
];

export const components: TamboComponent[] = [
	{
		name: "Graph",
		description:
			"A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
		component: Graph,
		propsSchema: graphSchema,
	},
	{
		name: "DataCard",
		description:
			"A component that displays options as clickable cards with links and summaries with the ability to select multiple items.",
		component: DataCard,
		propsSchema: dataCardSchema,
	},
];
