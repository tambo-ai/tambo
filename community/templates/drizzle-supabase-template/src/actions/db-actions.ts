'use server';

import { db } from '@/lib/db';
import { tasks, type NewTask } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function queryTasks(filters?: {
    status?: 'todo' | 'in_progress' | 'done',
    priority?: 'low' | 'medium' | 'high'
}) {
    try {
        // Build query conditionally to avoid TypeScript type reassignment issues
        const baseQuery = db.select().from(tasks);

        let results;
        if (filters?.status && filters?.priority) {
            results = await baseQuery
                .where(and(eq(tasks.status, filters.status), eq(tasks.priority, filters.priority)))
                .orderBy(desc(tasks.createdAt));
        } else if (filters?.status) {
            results = await baseQuery
                .where(eq(tasks.status, filters.status))
                .orderBy(desc(tasks.createdAt));
        } else if (filters?.priority) {
            results = await baseQuery
                .where(eq(tasks.priority, filters.priority))
                .orderBy(desc(tasks.createdAt));
        } else {
            results = await baseQuery.orderBy(desc(tasks.createdAt));
        }

        return results.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            createdAt: task.createdAt.toISOString(),
        }));
    } catch (error) {
        console.error('Failed to query tasks:', error);
        return [];
    }
}

export async function insertTask(data: {
    title: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
}) {
    try {
        const newTask: NewTask = {
            title: data.title,
            description: data.description,
            status: data.status || 'todo',
            priority: data.priority || 'medium',
        };

        const [result] = await db.insert(tasks).values(newTask).returning();

        return {
            id: result.id,
            title: result.title,
            description: result.description,
            status: result.status,
            priority: result.priority,
            createdAt: result.createdAt.toISOString(),
        };
    } catch (error) {
        console.error('Failed to insert task:', error);
        throw error;
    }
}
