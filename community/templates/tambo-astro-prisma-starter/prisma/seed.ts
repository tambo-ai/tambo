import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    name: "MacBook Air M3",
    category: "Laptop",
    price: 1099,
    tags: "lightweight, apple, student, office, battery",
  },
  {
    name: "Dell XPS 15",
    category: "Laptop",
    price: 1499,
    tags: "windows, professional, coding, battery",
  },
  {
    name: "Asus ROG Zephyrus",
    category: "Laptop",
    price: 1899,
    tags: "gaming, rgb, high-performance, nvidia, heavy",
  },
  {
    name: "Pixel 8 Pro",
    category: "Phone",
    price: 999,
    tags: "android, photography, google, ai, camera",
  },
  {
    name: "iPhone 15 Pro",
    category: "Phone",
    price: 1099,
    tags: "ios, apple, camera, premium, gaming",
  },
  {
    name: "Sony A7 IV",
    category: "Camera",
    price: 2498,
    tags: "photography, video, professional, full-frame",
  },
  {
    name: "iPad Pro 12.9",
    category: "Tablet",
    price: 1099,
    tags: "creative, drawing, apple, portable, 120hz",
  },
  {
    name: "Sony WH-1000XM5",
    category: "Headphones",
    price: 349,
    tags: "noise-cancelling, travel, audio, wireless, comfort",
  },
];

async function main() {
  console.log(`Seeding ${products.length} products...`);
  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
