"use client";

import { withInteractable } from "@tambo-ai/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { addItemToCart } from "@/lib/shopping-utils";

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.string(),
  image: z.string(),
  stock: z.number(),
});

const productStoreSchema = z.object({
  products: z.array(productSchema),
  highlightedProductId: z.string().optional(),
});

type Product = z.infer<typeof productSchema>;
type ProductStoreProps = z.infer<typeof productStoreSchema>;

function ProductStoreBase(props: ProductStoreProps) {
  const [products, setProducts] = useState<Product[]>(props.products);
  const [highlightedId, setHighlightedId] = useState<string | undefined>(
    props.highlightedProductId
  );
  const [cartCounts, setCartCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setProducts(props.products);
    setHighlightedId(props.highlightedProductId);

    // Clear highlight after animation
    if (props.highlightedProductId) {
      const timer = setTimeout(() => {
        setHighlightedId(undefined);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [props]);

  const addToCart = async (product: Product) => {
    try {
      addItemToCart({
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        productImage: product.image,
        quantity: 1,
      });

      setCartCounts((prev) => ({
        ...prev,
        [product.id]: (prev[product.id] || 0) + 1,
      }));
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert("Failed to add to cart");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Products</h2>
        <span className="text-sm text-gray-500">{products.length}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((product) => {
          const isHighlighted = highlightedId === product.id;
          const cartCount = cartCounts[product.id] || 0;

          return (
            <div
              key={product.id}
              className={`border border-gray-200 rounded-lg p-4 ${
                isHighlighted ? "ring-2 ring-blue-500 animate-pulse" : ""
              }`}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-32 object-cover rounded mb-3"
              />

              <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                {product.description}
              </p>

              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-semibold text-gray-900">
                  ${product.price}
                </span>
                <span className="text-xs text-gray-500">Stock: {product.stock}</span>
              </div>

              <button
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className="w-full px-3 py-2 rounded-md font-medium transition-colors bg-[#7FFFC3] hover:bg-[#72e6b0] text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                {cartCount > 0 && ` (${cartCount})`}
              </button>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No products available</p>
        </div>
      )}
    </div>
  );
}

export const InteractableProductStore = withInteractable(ProductStoreBase, {
  componentName: "ProductStore",
  description: "E-commerce product store with add to cart functionality",
  propsSchema: productStoreSchema,
});
