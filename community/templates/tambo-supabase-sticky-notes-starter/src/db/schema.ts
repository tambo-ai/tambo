import {
  pgTable,
  bigint,
  text,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  content: text("content").notNull(),
  color: text("color").notNull(),
  x: doublePrecision("x").default(0).notNull(),
  y: doublePrecision("y").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
