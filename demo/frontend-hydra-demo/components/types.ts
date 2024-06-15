import { z } from "zod";

export const TimeSeriesDataPrompt =
  "Based on the provided information, fill in the below for a Time Series Data component:";

export const TimeSeriesDataProps = z
  .object({
    title: z.string().describe("Title of the time series data"),
    titleClassName: z.string().describe("Tailwinds class for the title"),
    description: z.string().describe("Description of the time series data"),
    descriptionClassName: z
      .string()
      .describe("Tailwinds class for the description"),
    data: z
      .array(
        z.object({
          timestamp: z.string().describe("Timestamp of the data point"),
          value: z.number().describe("Value of the data point"),
        })
      )
      .describe("Array of time series data points"),
    dataClassName: z.string().describe("Tailwinds class for the data"),
  })
  .describe(
    "Ensure all the tailwind classes are valid and the component is styled to match the rest of the style"
  );
