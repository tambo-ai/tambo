import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { products } from "../lib/data";

export const compareProducts: TamboTool = {
  name: "compareProducts",
  description:
    "Compares multiple products based on their IDs. When matches are found, provide a very brief, generic intro in text (e.g., 'Here is a comparison of the products you requested:'). Do NOT repeat names, prices, or categories in your text response, as the comparison component will display these fields authoritatively.",
  inputSchema: z.object({
    productIds: z.array(z.string()).describe("Product IDs to compare"),
  }),
  outputSchema: z.object({
    comparison: z.array(
      z.object({
        name: z.string(),
        category: z.string(),
        price: z.number(),
        strengths: z.array(z.string()),
      })
    ),
  }),
  tool: async ({ productIds }) => {
    const selected = products.filter((p) => productIds.includes(p.id));

    return {
      comparison: selected.map((p) => ({
        name: p.name,
        category: p.category,
        price: p.price,
        strengths: p.tags,
      })),
    };
  },
};
