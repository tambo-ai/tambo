/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { InteractableProductStore } from "@/app/interactables/components/product-store";
import { InteractableShoppingCart } from "@/app/interactables/components/shopping-cart";
import { shoppingTools } from "./shopping-tools";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  // Shopping tools
  ...shoppingTools,
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "ProductStore",
    description:
      "E-commerce product store component displaying products with add to cart functionality. Can highlight specific products.",
    component: InteractableProductStore,
    propsSchema: z.object({
      products: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          price: z.string(),
          image: z.string(),
          stock: z.number(),
        }),
      ),
      highlightedProductId: z.string().optional(),
    }),
  },
  {
    name: "ShoppingCart",
    description:
      "Shopping cart component showing items with quantity controls, remove options, and total price calculation. Can highlight specific items.",
    component: InteractableShoppingCart,
    propsSchema: z.object({
      items: z.array(
        z.object({
          id: z.string(),
          productId: z.string(),
          productName: z.string(),
          productPrice: z.string(),
          productImage: z.string(),
          quantity: z.number(),
        }),
      ),
      highlightedItemId: z.string().optional(),
    }),
  },
];


