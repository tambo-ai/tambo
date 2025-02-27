import type { ComponentDecisionV2, ToolCallRequest } from "@use-hydra-ai/core";
import {
  ActionType,
  ChatCompletionContentPart,
  GenerationStage,
  MessageRole,
} from "@use-hydra-ai/core";
import { relations, sql } from "drizzle-orm";
import { index, pgTable } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { customJsonb } from "./drizzleUtil";
export { authUsers } from "drizzle-orm/supabase";

export const projects = pgTable("projects", ({ text, timestamp }) => ({
  id: text("id")
    .primaryKey()
    .notNull()
    .unique()
    .default(sql`generate_custom_id('p_')`),
  legacyId: text("legacy_id").unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}));
export type DBProject = typeof projects.$inferSelect;
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
export type DBProjectMember = typeof projectMembers.$inferSelect;
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

export const apiKeys = pgTable("api_keys", ({ text, timestamp, uuid }) => ({
  id: text("id")
    .primaryKey()
    .notNull()
    .unique()
    .default(sql`generate_custom_id('hk_')`),
  name: text("name").notNull(),
  hashedKey: text("hashed_key").notNull(),
  partiallyHiddenKey: text("partially_hidden_key"),
  projectId: text("project_id")
    .references(() => projects.id)
    .notNull(),
  createdByUserId: uuid("created_by_user_id")
    .references(() => authUsers.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
}));
export type DBApiKey = typeof apiKeys.$inferSelect;
export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
  createdBy: one(authUsers, {
    fields: [apiKeys.createdByUserId],
    references: [authUsers.id],
  }),
  project: one(projects, {
    fields: [apiKeys.projectId],
    references: [projects.id],
  }),
}));

export const providerKeys = pgTable("provider_keys", ({ text, timestamp }) => ({
  id: text("id")
    .primaryKey()
    .notNull()
    .unique()
    .default(sql`generate_custom_id('pvk_')`),
  projectId: text("project_id")
    .references(() => projects.id)
    .notNull(),
  providerName: text("provider_name").notNull(),
  providerKeyEncrypted: text("provider_key_encrypted").notNull(),
  partiallyHiddenKey: text("partially_hidden_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
}));

export const providerKeyRelations = relations(providerKeys, ({ one }) => ({
  project: one(projects, {
    fields: [providerKeys.projectId],
    references: [projects.id],
  }),
}));

export const projectRelations = relations(projects, ({ many }) => ({
  members: many(projectMembers),
  apiKeys: many(apiKeys),
  providerKeys: many(providerKeys),
}));

export const threads = pgTable(
  "threads",
  ({ text, timestamp }) => ({
    id: text("id")
      .primaryKey()
      .notNull()
      .unique()
      .default(sql`generate_custom_id('thr_')`),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    contextKey: text("context_key"),
    metadata: customJsonb<Record<string, unknown>>("metadata"),
    generationStage: text("generation_stage", {
      enum: Object.values<string>(GenerationStage) as [GenerationStage],
    })
      .default(GenerationStage.IDLE)
      .notNull(),
    statusMessage: text("status_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }),
  (table) => {
    return {
      contextKeyIdx: index("threads_context_key_idx").on(table.contextKey),
    };
  },
);
export type DBThread = typeof threads.$inferSelect;
export const messages = pgTable("messages", ({ text, timestamp }) => ({
  id: text("id")
    .primaryKey()
    .notNull()
    .unique()
    .default(sql`generate_custom_id('msg_')`),
  threadId: text("thread_id")
    .references(() => threads.id)
    .notNull(),
  role: text("role", {
    enum: Object.values<string>(MessageRole) as [MessageRole],
  }).notNull(),
  content: customJsonb<string | ChatCompletionContentPart[]>(
    "content",
  ).notNull(),
  componentDecision: customJsonb<ComponentDecisionV2>("component_decision"),
  componentState: customJsonb<Record<string, unknown>>("component_state"),
  toolCallRequest: customJsonb<ToolCallRequest>("tool_call_request"),
  actionType: text("action_type", {
    enum: Object.values<string>(ActionType) as [ActionType],
  }),
  metadata: customJsonb<Record<string, unknown>>("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}));

export type DBMessage = typeof messages.$inferSelect;

export const threadRelations = relations(threads, ({ one, many }) => ({
  project: one(projects, {
    fields: [threads.projectId],
    references: [projects.id],
  }),
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one, many }) => ({
  thread: one(threads, {
    fields: [messages.threadId],
    references: [threads.id],
  }),
  suggestions: many(suggestions),
}));

export const suggestions = pgTable("suggestions", ({ text, timestamp }) => ({
  id: text("id")
    .primaryKey()
    .notNull()
    .unique()
    .default(sql`generate_custom_id('sug_')`),
  messageId: text("message_id")
    .references(() => messages.id)
    .notNull(),
  title: text("title").notNull(),
  detailedSuggestion: text("detailed_suggestion").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}));

export type DBSuggestion = typeof suggestions.$inferSelect;

export const suggestionRelations = relations(suggestions, ({ one }) => ({
  message: one(messages, {
    fields: [suggestions.messageId],
    references: [messages.id],
  }),
}));
