import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const analyticsData = sqliteTable("analytics_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event: text("event").notNull(),
  value: integer("value").notNull(),
  timestamp: text("timestamp").notNull(),
});
