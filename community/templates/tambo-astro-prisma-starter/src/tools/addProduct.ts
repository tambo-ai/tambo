import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

export const addProduct: TamboTool = {
  name: "addProduct",
  description: "Adds a new product to the inventory. Returns the updated product list. CRITICAL: Do NOT list the products in your response. Just confirm the action (e.g., 'Added Bluetooth Speaker'). The UI will update automatically.",
  inputSchema: z.object({
    name: z.string(),
    category: z.string(),
    price: z.number(),
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
      })
    ),
    message: z.string().optional(),
  }),
  tool: async ({ name, category, price, tags }) => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, price, tags }),
      });

      if (!response.ok) {
        throw new Error("Failed to add product");
      }

      const products = await response.json();
      return { 
        products, 
        message: `Added ${name} to inventory.` 
      };
    } catch (error) {
      console.error(error);
      return { 
        products: [],
        error: "Failed to add product" 
      };
    }
  },
};
