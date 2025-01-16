import { relations, sql } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
export { authUsers } from "drizzle-orm/supabase";

export const projects = pgTable("projects", ({ text, timestamp }) => ({
  id: text("id")
    .primaryKey()
    .notNull()
    .unique()
    .default(sql`generate_custom_id('p_')`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}));

export const projectMembers = pgTable(
  "project_members",
  ({ uuid, text, timestamp, bigserial }) => ({
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => authUsers.id)
      .notNull(),
    role: text("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }),
);
// Add relations for project <-> members
export const projectRelations = relations(projects, ({ many }) => ({
  members: many(projectMembers),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(authUsers, {
    fields: [projectMembers.userId],
    references: [authUsers.id],
  }),
}));

export const userRelations = relations(authUsers, ({ many }) => ({
  projects: many(projectMembers),
}));
