export type Product = {
  id: string;
  name: string;
  category: "Laptop" | "Phone";
  price: number;
  tags: string[];
};

export const products: Product[] = [
  {
    id: "macbook-air-m1",
    name: "MacBook Air M1",
    category: "Laptop",
    price: 799,
    tags: ["coding", "battery", "lightweight"],
  },
  {
    id: "dell-xps-13",
    name: "Dell XPS 13",
    category: "Laptop",
    price: 999,
    tags: ["coding", "premium"],
  },
  {
    id: "iphone-14",
    name: "iPhone 14",
    category: "Phone",
    price: 699,
    tags: ["camera", "battery"],
  },
  {
    id: "pixel-7",
    name: "Pixel 7",
    category: "Phone",
    price: 599,
    tags: ["camera", "android"],
  },
];
