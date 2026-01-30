import { z } from "zod";

export type DataCardItem = {
  id: string;
  label: string;
  value: string;
  description?: string;
  url?: string;
};

export type DataCardState = {
  selectedValues: string[];
};

export const dataCardSchema = z.object({
  title: z.string().describe("Title displayed above the data cards"),
  options: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      value: z.string(),
      description: z.string().optional(),
      url: z.string().optional(),
    }),
  ),
});

export type DataCardProps = z.infer<typeof dataCardSchema>;
