"use client";

import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import { CheckCircle2, ExternalLink, ShoppingCart } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useState } from "react";
import { z } from "zod";

// Define the component state type
export type ProductShowcaseState = {
  cart: string[];
  lastAdded?: string;
};

const isSafeRemoteImage = (url: unknown): url is string => {
  try {
    const u = new URL(String(url));
    return (
      u.protocol === "https:" &&
      (u.hostname === "fakestoreapi.com" || u.hostname === "cdn.dummyjson.com")
    );
  } catch {
    return false;
  }
};

// Define the component props schema with Zod
export const productShowcaseSchema = z.object({
  title: z.string().describe("Title for the product showcase section"),
  category: z.string().optional().describe("Category of products being shown"),
  products: z
    .array(
      z.object({
        id: z.string().describe("Unique ID of the product"),
        name: z.string().describe("Display name of the product"),
        price: z.number().describe("Price of the product"),
        description: z.string().describe("Short description of the product"),
        imageUrl: z.string().describe("URL to the product image"),
      }),
    )
    .describe("Array of products to display"),
});

// Define the props type based on the Zod schema
export type ProductShowcaseProps = z.infer<typeof productShowcaseSchema> &
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Individual Product Card Component
 * Handles local state for image error fallbacks correctly (Rule of Hooks)
 */
const ProductCard = ({
  product,
  isInCart,
  onToggleCart,
}: {
  product: any;
  isInCart: boolean;
  onToggleCart: (id: string) => void;
}) => {
  const [error, setError] = useState(false);

  // React to prop changes by resetting error state
  React.useEffect(() => {
    setError(false);
  }, [product.id, product.imageUrl]);

  // const displaySrc =
  //   isValidImageUrl(product.imageUrl) && !error
  //     ? product.imageUrl
  //     : "/dummy.png";

  const displaySrc =
    !error && isSafeRemoteImage(product.imageUrl)
      ? product.imageUrl
      : "/dummy.png";

  return (
    <div
      className={cn(
        "group relative flex flex-col border rounded-lg overflow-hidden transition-all duration-200",
        isInCart
          ? "border-green-200 bg-green-50/30"
          : "border-gray-100 hover:border-blue-200 hover:shadow-md",
      )}
    >
      <div className="relative h-48 w-full overflow-hidden bg-gray-50 flex items-center justify-center p-4">
        <Image
          src={displaySrc.startsWith("/") ? displaySrc : displaySrc}
          alt={product.name || "Product Image"}
          fill
          unoptimized={displaySrc.startsWith("/")}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain transition-transform group-hover:scale-105 p-2"
          onError={() => setError(true)}
        />

        {isInCart && (
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg z-10">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1 h-12">
          <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2">
            {product.name}
          </h3>
          <span className="font-bold text-blue-600 ml-2">${product.price}</span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => onToggleCart(product.id)}
            className={cn(
              "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
              isInCart
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-blue-600 text-white hover:bg-blue-700",
            )}
          >
            {isInCart ? "In Cart" : "Add to Cart"}
          </button>
          <button className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * ProductShowcase Component
 */
export const ProductShowcase = React.forwardRef<
  HTMLDivElement,
  ProductShowcaseProps
>(({ title, products, category, className, ...props }, ref) => {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useTamboComponentState<ProductShowcaseState>(
    `product-showcase`,
    { cart: [] },
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = (productId: string) => {
    if (!state) return;

    const newCart = state.cart.includes(productId)
      ? state.cart.filter((id) => id !== productId)
      : [...state.cart, productId];

    setState({
      cart: newCart,
      lastAdded: !state.cart.includes(productId) ? productId : state.lastAdded,
    });
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "w-full bg-white rounded-xl border border-gray-100 h-[400px] animate-pulse",
          className,
        )}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        "w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden",
        className,
      )}
      {...props}
    >
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {category && (
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
              {category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
          <ShoppingCart className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">
            {state?.cart.length || 0} items
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {products?.map((product) => {
          const id = String(product.id);
          return (
            <ProductCard
              key={id}
              product={{ ...product, id }}
              isInCart={state?.cart.includes(id) || false}
              onToggleCart={handleAddToCart}
            />
          );
        })}
      </div>
    </div>
  );
});

ProductShowcase.displayName = "ProductShowcase";
