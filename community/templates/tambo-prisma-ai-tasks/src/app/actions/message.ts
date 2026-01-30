"use server";

import { prisma } from "@/lib/prisma";

export async function addMessage(
  threadId: string,
  role: string,
  content: string,
) {
  return prisma.message.create({
    data: {
      threadId,
      role,
      content,
    },
  });
}

export async function getThreadWithMessages(threadId: string) {
  return prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}
