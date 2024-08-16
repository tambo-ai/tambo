import { uuid, text, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";

export const registeredComponents = pgTable("registered_components", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").unique().notNull(),
    description: text("description").notNull(),
    prop_definitions: jsonb("prop_definitions").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow(),
    deleted_at: timestamp("deleted_at")
});
