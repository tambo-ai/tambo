/**
 * @file shopping-actions.ts
 * @description Modular actions used by Tambo shopping tools
 */

import {
  addItemToCart,
  clearCart,
  fetchAllProducts,
  findProduct,
  getCartFromStorage,
  getCartTotal,
  removeItemFromCart,
} from "./shopping-utils";

export type AddToCartInput = {
  productId?: string;
  productName?: string;
  quantity?: number;
};

export async function getProductsAction() {
  const products = await fetchAllProducts();
  return {
    success: true,
    products,
    count: products.length,
  };
}

export async function addToCartAction(input: AddToCartInput) {
  try {
    const product = await findProduct(input.productId, input.productName);

    if (!product) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    addItemToCart({
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: product.image,
      quantity: input.quantity || 1,
    });

    return {
      success: true,
      message: `Added ${product.name} to cart`,
      product: product.name,
      quantity: input.quantity || 1,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

export async function getCartAction() {
  try {
    const items = getCartFromStorage();
    const total = getCartTotal();

    return {
      success: true,
      items,
      total,
      itemCount: items.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      items: [],
      itemCount: 0,
    };
  }
}

export async function clearCartAction() {
  try {
    const items = getCartFromStorage();
    if (items.length === 0) {
      return {
        success: true,
        message: "Cart is already empty",
      };
    }

    clearCart();
    return {
      success: true,
      message: "Cart cleared successfully",
      clearedItems: items.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

export type RemoveFromCartInput = {
  productId?: string;
  productName?: string;
};

export async function removeFromCartAction(input: RemoveFromCartInput) {
  try {
    const cart = getCartFromStorage();
    
    // Find item in cart by product ID or name
    let itemToRemove = null;
    
    if (input.productId) {
      itemToRemove = cart.find((item) => item.productId === input.productId);
    } else if (input.productName) {
      itemToRemove = cart.find((item) =>
        item.productName.toLowerCase().includes(input.productName!.toLowerCase())
      );
    }
    
    if (!itemToRemove) {
      return {
        success: false,
        message: `Product "${input.productName || input.productId}" not found in cart`,
      };
    }
    
    removeItemFromCart(itemToRemove.id);
    
    return {
      success: true,
      message: `Removed ${itemToRemove.productName} from cart`,
      removedProduct: itemToRemove.productName,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}
