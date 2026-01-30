import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

export const updateProduct: TamboTool = {
  name: "updateProduct",
  description:
    "Updates an existing product's price or tags. Returns the updated product list. CRITICAL: Do NOT list the products in your response. Just confirm the action. The UI will update automatically.",
  inputSchema: z.object({
    name: z
      .string()
      .optional()
      .describe("Name of the product to update (fuzzy match)"),
    id: z.number().optional(),
    price: z.number().optional(),
    tags: z.string().optional(),
  }),
  outputSchema: z.object({
    products: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        category: z.string(),
        price: z.number(),
        tags: z.string(),
      }),
    ),
    message: z.string().optional(),
  }),
  tool: async ({ name, id, price, tags }) => {
    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, id, price, tags }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      const products = await response.json();
      return {
        products,
        message: `Updated product details.`,
      };
    } catch (error) {
      console.error(error);
      return {
        products: [],
        error: "Failed to update product",
      };
    }
  },
};
