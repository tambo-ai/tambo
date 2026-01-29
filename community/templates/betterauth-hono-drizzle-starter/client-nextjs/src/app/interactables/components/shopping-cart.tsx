"use client";

import { withInteractable } from "@tambo-ai/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  updateItemQuantity,
  removeItemFromCart,
} from "@/lib/shopping-utils";

const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  productPrice: z.string(),
  productImage: z.string(),
  quantity: z.number(),
});

const shoppingCartSchema = z.object({
  items: z.array(cartItemSchema),
  highlightedItemId: z.string().optional(),
});

type CartItem = z.infer<typeof cartItemSchema>;
type ShoppingCartProps = z.infer<typeof shoppingCartSchema>;

function ShoppingCartBase(props: ShoppingCartProps) {
  const [items, setItems] = useState<CartItem[]>(props.items);
  const [highlightedId, setHighlightedId] = useState<string | undefined>(
    props.highlightedItemId
  );

  useEffect(() => {
    setItems(props.items);
    setHighlightedId(props.highlightedItemId);

    if (props.highlightedItemId) {
      const timer = setTimeout(() => {
        setHighlightedId(undefined);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [props]);

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      updateItemQuantity(itemId, newQuantity);
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      removeItemFromCart(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const total = items.reduce(
    (sum, item) => sum + parseFloat(item.productPrice) * item.quantity,
    0
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
        <span className="text-sm text-gray-500">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Cart is empty</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {items.map((item) => {
              const isHighlighted = highlightedId === item.id;
              const itemTotal = parseFloat(item.productPrice) * item.quantity;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row gap-3 p-3 border rounded ${
                    isHighlighted ? "ring-2 ring-green-500 animate-pulse" : ""
                  }`}
                >
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-full sm:w-16 h-32 sm:h-16 object-cover rounded"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{item.productName}</h3>
                    <p className="text-blue-600 text-sm">${item.productPrice}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 text-xs bg-gray-100 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-0 flex w-full sm:w-auto sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-1">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 text-xs shrink-0"
                    >
                      Remove
                    </button>
                    <div className="font-semibold text-gray-900 sm:text-right whitespace-nowrap">
                      ${itemTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold">Total:</span>
              <span className="text-xl font-semibold text-gray-900">
                ${total.toFixed(2)}
              </span>
            </div>

            <button className="w-full px-3 py-2 rounded-md font-medium transition-colors bg-[#FFE17F] hover:bg-[#f5d570] text-gray-800">
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export const InteractableShoppingCart = withInteractable(ShoppingCartBase, {
  componentName: "ShoppingCart",
  description: "Shopping cart with items, quantity controls, and total price",
  propsSchema: shoppingCartSchema,
});
