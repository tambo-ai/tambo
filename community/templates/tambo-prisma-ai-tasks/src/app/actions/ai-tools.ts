"use server";

import { prisma } from "@/lib/prisma";

export async function aiCreateThread(title: string) {
  return prisma.thread.create({
    data: { title },
  });
}

export async function aiListThreads() {
  return prisma.thread.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });
}
