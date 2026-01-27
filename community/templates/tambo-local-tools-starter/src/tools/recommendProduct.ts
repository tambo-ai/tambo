import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { products } from "../lib/data";

export const recommendProduct: TamboTool = {
  name: "recommendProduct",
  description:
    "Recommends products based on use case, category, and max price. When matches are found, provide a very brief, generic intro in text (e.g., 'Here are some recommendations based on your request:'). Do NOT repeat product names, prices, or details in your text response, as the 'ProductCard' component will display this information authoritatively.",
  inputSchema: z.object({
    useCase: z.string().describe("What the user wants the product for (e.g., 'coding', 'camera', 'battery')"),
    category: z.enum(["Laptop", "Phone"]).optional(),
    maxPrice: z.number().optional().describe("Maximum budget in USD"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        category: z.string(),
        reason: z.string(),
      })
    ),
    message: z.string().optional(),
  }),
  tool: async ({ useCase, category, maxPrice }) => {
    const matches = products.filter((product) => {
      const matchesUseCase = product.tags.some((tag) =>
        useCase.toLowerCase().includes(tag)
      );

      const matchesCategory = category ? product.category === category : true;
      const matchesPrice = maxPrice ? product.price <= maxPrice : true;

      return matchesUseCase && matchesCategory && matchesPrice;
    });

    if (matches.length === 0) {
      return {
        results: [],
        message:
          "No products matched your request. Try use cases like 'coding', 'camera', or 'battery', or increase your budget.",
      };
    }

    return {
      results: matches.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        reason: `Matches your requirement for ${useCase}.`,
      })),
    };
  },
};
