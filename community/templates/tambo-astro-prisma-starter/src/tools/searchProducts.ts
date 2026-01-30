import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

export const searchProducts: TamboTool = {
  name: "searchProducts",
  description:
    "Searches for products. Returns a list of matches. CRITICAL: Do NOT list the products in your response. Just say 'Here are the results' or 'Filtered by...'. The UI will update automatically.",
  inputSchema: z.object({
    useCase: z.string().optional().describe("What the user wants the product for (e.g. 'coding', 'camera')"),
    category: z.enum(["Laptop", "Phone", "Camera", "Tablet", "Headphones", "Accessory"]).optional(),
    maxPrice: z.number().optional(),
  }),
  outputSchema: z.object({
    products: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        category: z.string(),
        price: z.number(),
        tags: z.string(),
      })
    ),
    message: z.string().optional(),
  }),
  tool: async ({ useCase, category, maxPrice }) => {
    const params = new URLSearchParams();
    if (useCase) params.append("useCase", useCase);
    if (category) params.append("category", category);
    if (maxPrice) params.append("maxPrice", maxPrice.toString());

    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error("API request failed");
      
      const products = await response.json();

      if (products.length === 0) {
        return {
          products: [],
          message: "No products matched. Try 'gaming', 'camera', or 'battery-focused'.",
        };
      }

      return {
        products: products,
        message: undefined,
      };
    } catch (error) {
      console.error("Search tool error:", error);
      return {
        products: [],
        message: "Sorry, I encountered an error searching the database.",
      };
    }
  },
};
