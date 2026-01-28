import prisma from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    include: {
      posts: true,
    },
  });

  return Response.json(users);
}
