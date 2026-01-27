import { z } from "zod";
import { ComparisonTable } from "../components/tambo/ComparisonTable";
import { ProductCard } from "../components/tambo/ProductCard";
import { compareProducts } from "../tools/compareProducts";
import { recommendProduct } from "../tools/recommendProduct";

export const tools = [recommendProduct, compareProducts];

export const components = [
  {
    name: "ProductCard",
    description: "Displays a recommended product card",
    component: ProductCard,
    propsSchema: z.object({
      name: z.string(),
      price: z.number(),
      category: z.string(),
      reason: z.string(),
    }),
  },
  {
    name: "ComparisonTable",
    description: "Displays a comparison table of products",
    component: ComparisonTable,
    propsSchema: z.object({
      comparison: z.array(
        z.object({
          name: z.string(),
          category: z.string(),
          price: z.number(),
          strengths: z.array(z.string()),
        })
      ),
    }),
  },
];
