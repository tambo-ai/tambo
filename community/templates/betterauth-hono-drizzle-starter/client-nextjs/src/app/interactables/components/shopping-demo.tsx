"use client";

import { InteractableProductStore } from "./product-store";
import { InteractableShoppingCart } from "./shopping-cart";
import { useEffect, useState } from "react";
import { fetchAllProducts, getCartFromStorage } from "@/lib/shopping-utils";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  stock: number;
}

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: string;
  productImage: string;
  quantity: number;
}

export function ShoppingDemo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    const products = await fetchAllProducts();
    setProducts(products);
  };

  const fetchCart = async () => {
    const cart = getCartFromStorage();
    setCartItems(cart);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCart()]);
      setLoading(false);
    };

    loadData();

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCart();
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h1 className="text-lg font-semibold text-gray-900">Shopping Demo</h1>
        <p className="text-sm text-gray-600 mt-1">
          Try: "Show products" or "Add headphones to cart"
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InteractableProductStore
            products={products}
            onPropsUpdate={(newProps) => {
              console.log("Product store updated:", newProps);
              if (newProps.products && Array.isArray(newProps.products)) {
                setProducts(newProps.products as Product[]);
              }
            }}
          />
        </div>

        <div className="lg:col-span-1">
          <InteractableShoppingCart
            items={cartItems}
            onPropsUpdate={(newProps) => {
              console.log("Cart updated:", newProps);
              if (newProps.items && Array.isArray(newProps.items)) {
                setCartItems(newProps.items as CartItem[]);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
