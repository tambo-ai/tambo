/**
 * @file product-service.ts
 * @description Service for fetching jewelry products from fakestoreapi
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
}

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

const isSafeRemoteImage = (url: unknown): url is string => {
  try {
    const u = new URL(String(url));

    return (
      u.protocol === "https:" &&
      u.hostname === "fakestoreapi.com" &&
      u.pathname.startsWith("/img/") &&
      /\.(png|jpg|jpeg|webp)$/i.test(u.pathname)
    );
  } catch {
    return false;
  }
};

/**
 * Fetches jewelry products from fakestoreapi
 */
export const getProducts = async (
  filter?: ProductFilter,
): Promise<Product[]> => {
  console.log("Fetching jewelry products...");
  const url = "https://fakestoreapi.com/products/category/jewelery";

  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`API fetch failed with status ${response.status}`);

    const data = await response.json();
    return standardizeData(data, filter);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

/**
 * Maps raw API data to standardized Product interface
 */
const standardizeData = (
  rawItems: any[],
  filter?: ProductFilter,
): Product[] => {
  const items = Array.isArray(rawItems) ? rawItems : [];

  let products: Product[] = items.map((item: any) => ({
    id: String(item.id),
    name: item.title || item.name || "Unknown Product",
    price: Number(item.price) || 0,
    description: item.description || "No description available",
    category: item.category || "jewelery",
    // imageUrl: item.image && isValidImageUrl(item.image) ? item.image : "/dummy.png",
    imageUrl: isSafeRemoteImage(item.image) ? item.image : "/dummy.png",
  }));

  // Apply filters
  if (filter) {
    const keyword = filter.category?.toLowerCase();

    // Keyword search within jewelry (e.g., "ring")
    if (keyword && products.length > 0) {
      const precisionResults = products.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.description.toLowerCase().includes(keyword),
      );
      if (precisionResults.length > 0) {
        products = precisionResults;
      }
    }

    if (filter.minPrice !== undefined) {
      products = products.filter((p) => p.price >= filter.minPrice!);
    }
    if (filter.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= filter.maxPrice!);
    }
    if (filter.limit && filter.limit > 0) {
      products = products.slice(0, filter.limit);
    }
  }

  return products;
};
