import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done']);
export const priorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);

export const tasks = pgTable('tasks', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    status: statusEnum('status').notNull().default('todo'),
    priority: priorityEnum('priority').notNull().default('medium'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
