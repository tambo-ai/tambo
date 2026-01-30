"use server";

import { prisma } from "@/lib/prisma";

/**
 * Create a new task
 */
export async function aiCreateTask(title: string) {
  const titleKey = title.trim().toLowerCase();

  try {
    return await prisma.task.create({
      data: {
        title: title.trim(),
        titleKey,
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new Error(`A task named "${title}" already exists.`);
    }
    throw error;
  }
}

/**
 * Update a task
 */

export async function aiUpdateTask(params: {
  id: string;
  title?: string;
  completed?: boolean;
}) {
  const { id, title, completed } = params;

  try {
    return await prisma.task.update({
      where: { id },
      data: {
        ...(title
          ? {
              title: title.trim(),
              titleKey: title.trim().toLowerCase(),
            }
          : {}),
        ...(completed !== undefined ? { completed } : {}),
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new Error(`A task named "${title}" already exists.`);
    }
    throw error;
  }
}

/**
 * List all tasks
 */
export async function aiListTasks() {
  return prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Delete a task
 */
export async function aiDeleteTask(id: string) {
  return prisma.task.delete({
    where: { id },
  });
}
