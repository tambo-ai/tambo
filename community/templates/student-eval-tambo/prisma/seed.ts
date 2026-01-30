import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.student.deleteMany();

  await prisma.student.createMany({
    data: [
      { name: "Aarav Sharma", subject: "Maths", score: 92 },
      { name: "Priya Patel", subject: "Science", score: 78 },
      { name: "Rahul Verma", subject: "English", score: 65 },
      { name: "Sneha Kulkarni", subject: "Maths", score: 55 },
      { name: "Aditya Singh", subject: "Science", score: 88 },
      { name: "Neha Gupta", subject: "English", score: 45 },
    ],
  });

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
