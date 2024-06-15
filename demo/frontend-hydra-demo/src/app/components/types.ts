import { z } from "zod";

const DataPoint = z.object({
  timestamp: z.string().describe("Timestamp of the data point"),
  value: z.string().describe("Value of the data point"),
});

const Series = z.object({
  label: z.string().describe("Label for the series"),
  data: z.array(DataPoint).describe("Array of data points"),
  lineColor: z
    .string()
    .regex(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/)
    .describe("RGB for color of the line in the format rgb(r, g, b)"),
});
export const LineGraphProps = z.object({
  backgroundColor: z
    .string()
    .describe("This is tailwinds class for the background color"),
  titleClassName: z.string().describe("Tailwinds class for the title"),
  title: z.string().describe("Title of the line graph"),
  descriptionClassName: z
    .string()
    .describe("Tailwinds class for the description"),
  description: z.string().describe("Description of the line graph"),
  series: z.array(Series).describe("Array of series data for the line graph"),
});
