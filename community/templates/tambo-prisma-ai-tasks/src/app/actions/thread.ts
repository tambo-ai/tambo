"use server";

import { prisma } from "@/lib/prisma";

export async function createThread() {
  const thread = await prisma.thread.create({
    data: {
      title: "New Thread",
    },
  });

  return thread;
}

export async function getThreads() {
  return prisma.thread.findMany({
    orderBy: { createdAt: "desc" },
  });
}
