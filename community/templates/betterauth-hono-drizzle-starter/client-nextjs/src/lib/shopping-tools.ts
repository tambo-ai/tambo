/**
 * @file shopping-tools.ts
 * @description Tambo tools for shopping cart functionality
 */

import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import {
  addToCartAction,
  clearCartAction,
  getCartAction,
  getProductsAction,  removeFromCartAction,} from "./shopping-actions";

/**
 * Get all products tool
 */
export const getProductsTool: TamboTool = {
  name: "getProducts",
  description: "Fetch all available products from the store",
  tool: getProductsAction,
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    products: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        price: z.string(),
        image: z.string(),
        stock: z.number(),
      })
    ),
    count: z.number(),
  }),
};

/**
 * Add to cart tool
 */
export const addToCartTool: TamboTool = {
  name: "addToCart",
  description: "Add a product to the shopping cart by product name or ID",
  tool: addToCartAction,
  inputSchema: z.object({
    productId: z.string().optional(),
    productName: z.string().optional(),
    quantity: z.number().optional().default(1),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    product: z.string().optional(),
    quantity: z.number().optional(),
  }),
};

/**
 * Get cart tool
 */
export const getCartTool: TamboTool = {
  name: "getCart",
  description: "Get all items in the shopping cart",
  tool: getCartAction,
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    items: z.array(
      z.object({
        id: z.string(),
        productId: z.string(),
        productName: z.string(),
        productPrice: z.string(),
        productImage: z.string(),
        quantity: z.number(),
      })
    ),
    total: z.string(),
    itemCount: z.number(),
    message: z.string().optional(),
  }),
};

/**
 * Clear cart tool
 */
export const clearCartTool: TamboTool = {
  name: "clearCart",
  description: "Remove all items from the shopping cart",
  tool: clearCartAction,
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    clearedItems: z.number().optional(),
  }),
};
/**
 * Remove from cart tool
 */
export const removeFromCartTool: TamboTool = {
  name: "removeFromCart",
  description: "Remove a specific product from the shopping cart by product name or ID",
  tool: removeFromCartAction,
  inputSchema: z.object({
    productId: z.string().optional(),
    productName: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    removedProduct: z.string().optional(),
  }),
};
/**
 * All shopping tools
 */
export const shoppingTools: TamboTool[] = [
  getProductsTool,
  addToCartTool,
  getCartTool,
  removeFromCartTool,
  clearCartTool,
];
