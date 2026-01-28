import prisma from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany();
  console.log(users);
  return Response.json(users);
}
