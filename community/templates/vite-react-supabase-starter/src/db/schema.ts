import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const stickyNotes = pgTable("sticky_notes", {
    id: text("id").primaryKey(),
    title: text("title"),
    content: text("content").notNull(),
    color: text("color").default("neutral"),
    position: jsonb("position").$type<{ x: number; y: number }>(),
    canvasId: text("canvas_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type StickyNote = typeof stickyNotes.$inferSelect;
export type NewStickyNote = typeof stickyNotes.$inferInsert;
