/**
 * @file shopping-utils.ts
 * @description Shared utilities for shopping cart operations
 */

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: string;
  productImage: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  stock: number;
}

const CART_STORAGE_KEY = "cart";

/**
 * Get cart from localStorage
 */
export function getCartFromStorage(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Save cart to localStorage
 */
export function saveCartToStorage(cart: CartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

/**
 * Add item to cart
 */
export function addItemToCart(item: Omit<CartItem, "id">): CartItem[] {
  const cart = getCartFromStorage();
  const existingItem = cart.find((c) => c.productId === item.productId);

  if (existingItem) {
    existingItem.quantity += item.quantity;
  } else {
    cart.push({
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...item,
    });
  }

  saveCartToStorage(cart);
  dispatchCartUpdate();
  return cart;
}

/**
 * Remove item from cart
 */
export function removeItemFromCart(itemId: string): CartItem[] {
  const cart = getCartFromStorage();
  const filtered = cart.filter((item) => item.id !== itemId);
  saveCartToStorage(filtered);
  dispatchCartUpdate();
  return filtered;
}

/**
 * Update item quantity
 */
export function updateItemQuantity(
  itemId: string,
  quantity: number
): CartItem[] {
  const cart = getCartFromStorage();
  const item = cart.find((c) => c.id === itemId);

  if (item) {
    item.quantity = quantity;
    saveCartToStorage(cart);
    dispatchCartUpdate();
  }

  return cart;
}

/**
 * Clear cart
 */
export function clearCart(): void {
  localStorage.removeItem(CART_STORAGE_KEY);
  dispatchCartUpdate();
}

/**
 * Get cart total
 */
export function getCartTotal(): string {
  const cart = getCartFromStorage();
  const total = cart.reduce(
    (sum, item) => sum + parseFloat(item.productPrice) * item.quantity,
    0
  );
  return total.toFixed(2);
}

/**
 * Dispatch cart update event for UI
 */
export function dispatchCartUpdate(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cart-updated"));
  }
}

/**
 * Fetch all products from API
 */
export async function fetchAllProducts(): Promise<Product[]> {
  try {
    const response = await fetch("http://localhost:8787/api/products");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

/**
 * Find product by name or ID
 */
export async function findProduct(
  productId?: string,
  productName?: string
): Promise<Product | null> {
  const products = await fetchAllProducts();

  if (productId) {
    return products.find((p) => p.id === productId) || null;
  }

  if (productName) {
    return (
      products.find((p) =>
        p.name.toLowerCase().includes(productName.toLowerCase())
      ) || null
    );
  }

  return null;
}
