import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

export const deleteProduct: TamboTool = {
  name: "deleteProduct",
  description: "Deletes a product from the inventory. Returns the updated product list. CRITICAL: Do NOT list the products in your response. Just confirm the action. The UI will update automatically.",
  inputSchema: z.object({
    name: z.string().optional(),
    id: z.number().optional(),
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
  tool: async ({ name, id }) => {
    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      const products = await response.json();
      return { 
        products,
        message: `Deleted product from inventory.` 
      };
    } catch (error) {
      console.error(error);
      return { 
        products: [],
        error: "Failed to delete product" 
      };
    }
  },
};
