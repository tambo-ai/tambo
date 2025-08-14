import {
  ActionType,
  ComponentDecisionV2,
  DeprecatedComposioAuthMode,
  GenerationStage,
  LogLevel,
  MCPTransport,
  MessageRole,
  OAuthClientInformation,
  OAuthTokens,
  OAuthValidationMode,
  SessionClientInformation,
  ToolCallRequest,
  ToolProviderType,
} from "@tambo-ai-cloud/core";
import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgPolicy,
  pgRole,
  pgSchema,
  pgTable,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import type OpenAI from "openai";
import { customJsonb } from "./drizzleUtil";
export { authenticatedRole, authUid } from "drizzle-orm/supabase";

/** Use this to get the project id from the api key */
export const projectApiKeyVariable = sql`current_setting('request.apikey.project_id')`;
export const projectApiKeyRole = pgRole("project_api_key", {
  inherit: true,
});

// User schema for NextAuth adapter tables
export const authSchema = pgSchema("auth");

export const authUsers = authSchema.table(
  "users",
  ({ text, timestamp, uuid, jsonb }) => ({
    id: uuid("id").primaryKey().notNull(),
    email: text("email"),
    emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    rawUserMetaData: jsonb("raw_user_meta_data").default({}),
  }),
  (table) => [index("user_email_idx").on(table.email)],
);

export const identities = authSchema.table(
  "identities",
  ({ text, timestamp, uuid, jsonb }) => ({
    id: uuid("id").primaryKey().notNull(),
    userId: uuid("user_id")
      .references(() => authUsers.id, { onDelete: "cascade" })
      .notNull(),
    provider: text("provider").notNull(),
    providerId: text("provider_id").notNull(),
    identityData: jsonb("identity_data").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
  (table) => [
    index("identity_provider_provider_id_idx").on(
      table.provider,
      table.providerId,
    ),
    index("identity_user_id_idx").on(table.userId),
  ],
);

export const sessions = authSchema.table(
  "sessions",
  ({ text, timestamp, uuid }) => ({
    id: text("id").primaryKey().notNull(),
    userId: uuid("user_id")
      .references(() => authUsers.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    notAfter: timestamp("not_after", { withTimezone: true }),
  }),
  (table) => [
    index("session_user_id_idx").on(table.userId),
    index("session_not_after_idx").on(table.notAfter),
  ],
);

// Relations for user schema tables
export const userSchemaUserRelations = relations(authUsers, ({ many }) => ({
  identities: many(identities),
  sessions: many(sessions),
  projects: many(projectMembers),
}));

export const userSchemaIdentityRelations = relations(identities, ({ one }) => ({
  user: one(authUsers, {
    fields: [identities.userId],
    references: [authUsers.id],
  }),
}));

export const userSchemaSessionRelations = relations(sessions, ({ one }) => ({
  user: one(authUsers, {
    fields: [sessions.userId],
    references: [authUsers.id],
  }),
}));

// Export types for user schema tables
export type DBUser = typeof authUsers.$inferSelect;
export type DBIdentity = typeof identities.$inferSelect;
export type DBSession = typeof sessions.$inferSelect;

export const projects = pgTable(
  "projects",
  ({ text, timestamp, uuid, boolean }) => ({
    id: text("id")
      .primaryKey()
      .notNull()
      .unique()
      .default(sql`generate_custom_id('p_')`),
    legacyId: text("legacy_id").unique(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    creatorId: uuid("creator_id")
      .references(() => authUsers.id)
      // Need to write raw `auth.uid()` becuse ${authUid} includes a select statement
      .default(sql`auth.uid()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    /** @deprecated - everyone has mcp now */
    deprecated_mcpEnabled: boolean("mcp_enabled").default(false).notNull(),
    /** @deprecated - everyone has mcp now */
    deprecatedComposioEnabled: boolean("composio_enabled")
      .default(false)
      .notNull(),
    /** Additional instructions that are injected into the system prompt */
    customInstructions: text("custom_instructions"),
    // New fields for default LLM configuration choices
    defaultLlmProviderName: text("default_llm_provider_name"), // e.g., "openai", "anthropic"
    defaultLlmModelName: text("default_llm_model_name"), // e.g., "gpt-4o", "claude-3-opus-20240229"
    customLlmModelName: text("custom_llm_model_name"), // custom model name for "openai-compatible" provider type
    customLlmBaseURL: text("custom_llm_base_url"), // For "openai-compatible" provider type
    maxInputTokens: integer("max_input_tokens"), // Maximum number of input tokens to send to the model
    maxToolCallLimit: integer("max_tool_call_limit").default(10).notNull(), // Maximum number of tool calls allowed per response
    // OAuth token validation settings
    oauthValidationMode: text("oauth_validation_mode", {
      enum: Object.values(OAuthValidationMode) as [OAuthValidationMode],
    })
      .notNull()
      .default(OAuthValidationMode.ASYMMETRIC_AUTO), // Default to no validation
    oauthSecretKeyEncrypted: text("oauth_secret_key_encrypted"), // Encrypted secret key for symmetric validation
    oauthPublicKey: text("oauth_public_key"), // Public key for manual asymmetric validation
    // Secret used to sign/verify first-party OAuth bearer access tokens issued by our API.
    // Generated per-project by Postgres with strong entropy. Kept server-side only.
    bearerTokenSecret: text("bearer_token_secret")
      .notNull()
      .default(sql`encode(gen_random_bytes(32), 'hex')`),
    isTokenRequired: boolean("is_token_required").default(false).notNull(),
  }),
  (table) => {
    return [
      pgPolicy("project_user_select_policy", {
        to: authenticatedRole,
        for: "select",
        using: sql`
          exists (
            select 1 
            from project_members 
            where project_members.project_id = ${table.id} 
              and project_members.user_id = ${authUid}
          ) or (
            ${table.creatorId} is not null 
            and ${table.creatorId} = ${authUid}
          )
        `,
      }),
      pgPolicy("project_user_update_policy", {
        to: authenticatedRole,
        for: "update",
        using: sql`exists (select 1 from project_members where project_members.project_id = ${table.id} and project_members.user_id = ${authUid})`,
      }),
      pgPolicy("project_user_delete_policy", {
        to: authenticatedRole,
        for: "delete",
        using: sql`exists (select 1 from project_members where project_members.project_id = ${table.id} and project_members.user_id = ${authUid})`,
      }),
      pgPolicy("project_user_insert_policy", {
        to: authenticatedRole,
        for: "insert",
        withCheck: sql`true`,
      }),
      pgPolicy("project_api_key_policy", {
        to: projectApiKeyRole,
        for: "select",
        using: sql`${table.id} = (select ${projectApiKeyVariable})`,
      }),
    ];
  },
);

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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
  (table) => {
    return [
      pgPolicy("project_members_user_policy", {
        to: authenticatedRole,
        using: sql`${table.userId} = ${authUid}`,
      }),
      pgPolicy("project_members_api_key_policy", {
        to: projectApiKeyRole,
        using: sql`${table.projectId} = (select ${projectApiKeyVariable})`,
      }),
    ];
  },
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
}));

export const providerKeyRelations = relations(providerKeys, ({ one }) => ({
  project: one(projects, {
    fields: [providerKeys.projectId],
    references: [projects.id],
  }),
}));

export const projectMessageUsage = pgTable(
  "project_message_usage",
  ({ text, timestamp, integer, boolean }) => ({
    projectId: text("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .primaryKey()
      .notNull(),
    messageCount: integer("message_count").notNull().default(0),
    hasApiKey: boolean("has_api_key").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    notificationSentAt: timestamp("notification_sent_at"),
    firstMessageSentAt: timestamp("first_message_sent_at"),
  }),
);

export const projectRelations = relations(projects, ({ many, one }) => ({
  members: many(projectMembers),
  apiKeys: many(apiKeys),
  providerKeys: many(providerKeys),
  creator: one(authUsers, {
    fields: [projects.creatorId],
    references: [authUsers.id],
  }),
  messageUsage: one(projectMessageUsage, {
    fields: [projects.id],
    references: [projectMessageUsage.projectId],
  }),
  toolProviders: many(toolProviders),
}));

export const threads = pgTable(
  "threads",
  ({ text, timestamp }) => ({
    id: text("id")
      .primaryKey()
      .notNull()
      .unique()
      .default(sql`generate_custom_id('thr_')`),
    name: text("name"),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    // this is effectively the end-user id
    contextKey: text("context_key"),
    metadata: customJsonb<Record<string, unknown>>("metadata"),
    generationStage: text("generation_stage", {
      enum: Object.values<string>(GenerationStage) as [GenerationStage],
    })
      .default(GenerationStage.IDLE)
      .notNull(),
    statusMessage: text("status_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
  (table) => {
    return [
      // Existing index for quick lookup by context key (end-user ID)
      index("threads_context_key_idx").on(table.contextKey),
      // New index to accelerate look-ups and sorting by the most recently
      // updated thread within a project.
      // The composite index (project_id, updated_at) supports queries where
      // we aggregate or order threads by their updated timestamp for a given
      // project (e.g. MAX(updated_at) GROUP BY project_id).
      index("threads_project_updated_idx").on(table.projectId, table.updatedAt),
      // Stand-alone index on updated_at to aid generic recency queries.
      index("threads_updated_at_idx").on(table.updatedAt),
    ];
  },
);
export type DBThread = typeof threads.$inferSelect;
export const messages = pgTable("messages", ({ text, timestamp, boolean }) => ({
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
  content:
    customJsonb<OpenAI.Chat.Completions.ChatCompletionContentPart[]>(
      "content",
    ).notNull(),
  additionalContext: customJsonb<Record<string, unknown>>("additional_context"),
  toolCallId: text("tool_call_id"),
  componentDecision: customJsonb<ComponentDecisionV2>("component_decision"),
  componentState: customJsonb<Record<string, unknown>>("component_state"),
  toolCallRequest: customJsonb<ToolCallRequest>("tool_call_request"),
  actionType: text("action_type", {
    enum: Object.values<string>(ActionType) as [ActionType],
  }),
  error: text("error"),
  metadata: customJsonb<Record<string, unknown>>("metadata"),
  isCancelled: boolean("is_cancelled").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`clock_timestamp()`)
    .notNull(),
}));

export type DBMessage = typeof messages.$inferSelect;
export type DBMessageWithThread = DBMessage & {
  thread: DBThread;
};
export type DBMessageWithSuggestions = DBMessage & {
  suggestions: DBSuggestion[];
};

export const threadRelations = relations(threads, ({ one, many }) => ({
  project: one(projects, {
    fields: [threads.projectId],
    references: [projects.id],
  }),
  messages: many(messages),
}));
export type DBThreadWithMessages = DBThread & {
  messages: DBMessageWithSuggestions[];
};

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
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

export type DBSuggestion = typeof suggestions.$inferSelect;

export const suggestionRelations = relations(suggestions, ({ one }) => ({
  message: one(messages, {
    fields: [suggestions.messageId],
    references: [messages.id],
  }),
}));

// Contacts table for email collection
export const contacts = pgTable("contacts", ({ text, timestamp, uuid }) => ({
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  metadata: customJsonb<Record<string, unknown>>("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

export const toolProviders = pgTable(
  "tool_providers",
  ({ text, timestamp, boolean }) => ({
    id: text("id")
      .primaryKey()
      .notNull()
      .unique()
      .default(sql`generate_custom_id('tp_')`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    type: text("type", {
      enum: Object.values(ToolProviderType) as [ToolProviderType],
    }).notNull(),
    url: text("url"),
    deprecatedComposioAppId: text("composio_app_id"),
    customHeaders: customJsonb<Record<string, string>>("custom_headers")
      .notNull()
      .default({}),
    mcpTransport: text("mcp_transport", {
      enum: Object.values(MCPTransport) as [MCPTransport],
    })
      .notNull()
      .default(MCPTransport.SSE),
    mcpRequiresAuth: boolean("mcp_requires_auth").notNull().default(false),
  }),
);

export const toolProviderRelations = relations(
  toolProviders,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [toolProviders.projectId],
      references: [projects.id],
    }),
    contexts: many(toolProviderUserContexts),
  }),
);

/**
 * Pairs a context key with a tool provider. This lets a contextKey have
 * specific auth context for a given toolProvider in a project
 *
 * For now this table doesn't really establish anything other than the existence
 * of a contextKey<->toolProviderId relationship, and when it was established.
 */
export const toolProviderUserContexts = pgTable(
  "tool_provider_user_contexts",
  ({ text, timestamp }) => ({
    id: text("id")
      .primaryKey()
      .notNull()
      .unique()
      .default(sql`generate_custom_id('tpu_')`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // this is effectively the end-user id. If null, then this is the default/global context for the tool provider.
    contextKey: text("context_key"),
    toolProviderId: text("tool_provider_id")
      .references(() => toolProviders.id, { onDelete: "cascade" })
      .notNull(),
    deprecatedComposioIntegrationId: text("composio_integration_id"),
    // once the connected account is created, we store the id here - if this is non-null, then we have a connected account
    deprecatedComposioConnectedAccountId: text("composio_connected_account_id"),
    deprecatedComposioConnectedAccountStatus: text(
      "composio_connected_account_status",
    ),
    deprecatedComposioRedirectUrl: text("composio_redirect_url"),
    deprecatedComposioAuthSchemaMode: text("composio_auth_schema_mode", {
      enum: Object.values(DeprecatedComposioAuthMode) as [
        DeprecatedComposioAuthMode,
      ],
    }),
    deprecatedComposioAuthFields: customJsonb<Record<string, string>>(
      "composio_auth_fields",
    )
      .default({})
      .notNull(),
    // contains the client information for the MCP OAuth client, including the client_id and client_secret
    mcpOauthClientInfo: customJsonb<OAuthClientInformation>(
      "mcp_oauth_client_info",
    ),
    mcpOauthTokens: customJsonb<OAuthTokens>("mcp_oauth_tokens"),
    mcpOauthLastRefreshedAt: timestamp("mcp_oauth_last_refreshed_at", {
      withTimezone: true,
    }).defaultNow(),
  }),
  (table) => {
    return [
      index("context_tool_providers_context_key_idx").on(table.contextKey),
      unique("context_tool_providers_context_key_tool_provider_idx").on(
        table.contextKey,
        table.toolProviderId,
      ),
    ];
  },
);
export const toolProviderUserContextRelations = relations(
  toolProviderUserContexts,
  ({ one }) => ({
    toolProvider: one(toolProviders, {
      fields: [toolProviderUserContexts.toolProviderId],
      references: [toolProviders.id],
    }),
  }),
);
// These are effectively sessions for the MCP OAuth flow.
export const mcpOauthClients = pgTable(
  "mcp_oauth_clients",
  ({ text, timestamp }) => ({
    id: text("id")
      .primaryKey()
      .notNull()
      .unique()
      .default(sql`generate_custom_id('moc_')`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    toolProviderUserContextId: text("tool_provider_user_context_id")
      .references(() => toolProviderUserContexts.id, { onDelete: "cascade" })
      .notNull(),
    sessionInfo:
      customJsonb<SessionClientInformation>("client_information").notNull(),
    // must be generated on the client before insertion
    sessionId: uuid("session_id").notNull(),
    codeVerifier: text("code_verifier"),
  }),
);
export const mcpOauthClientRelations = relations(
  mcpOauthClients,
  ({ one }) => ({
    toolProviderUserContext: one(toolProviderUserContexts, {
      fields: [mcpOauthClients.toolProviderUserContextId],
      references: [toolProviderUserContexts.id],
    }),
  }),
);
export type DBMcpOauthClient = typeof mcpOauthClients.$inferSelect;

export const tamboUsers = pgTable(
  "tambo_users",
  ({ text, timestamp, uuid, boolean, integer }) => ({
    id: text("id")
      .primaryKey()
      .notNull()
      .unique()
      .default(sql`generate_custom_id('tu_')`),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),

    // Activity tracking
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    hasSetupProject: boolean("has_setup_project").notNull().default(false),

    // Welcome email tracking
    welcomeEmailSent: boolean("welcome_email_sent").notNull().default(false),
    welcomeEmailError: text("welcome_email_error"),
    welcomeEmailSentAt: timestamp("welcome_email_sent_at", {
      withTimezone: true,
    }),

    // Reactivation email tracking
    reactivationEmailSentAt: timestamp("reactivation_email_sent_at", {
      withTimezone: true,
    }),
    reactivationEmailCount: integer("reactivation_email_count")
      .notNull()
      .default(0),

    // Legal acceptance tracking
    legalAccepted: boolean("legal_accepted").notNull().default(false),
    legalAcceptedAt: timestamp("legal_accepted_at", { withTimezone: true }),
    legalVersion: text("legal_version"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (table) => ({
    userIdIdx: index("idx_tambo_users_user_id").on(table.userId),
    lastActivityIdx: index("idx_tambo_users_last_activity").on(
      table.lastActivityAt,
    ),
    reactivationSentIdx: index("idx_tambo_users_reactivation_sent").on(
      table.reactivationEmailSentAt,
    ),
    welcomeEmailSentIdx: index("idx_tambo_users_welcome_email_sent").on(
      table.welcomeEmailSent,
    ),
    legalAcceptedIdx: index("idx_tambo_users_legal_accepted").on(
      table.legalAccepted,
    ),
    legalAcceptanceConsistent: check(
      "chk_tambo_users_legal_consistency",
      sql`(NOT ${table.legalAccepted}) OR (${table.legalAcceptedAt} IS NOT NULL AND ${table.legalVersion} IS NOT NULL)`,
    ),
  }),
);

export type DBTamboUser = typeof tamboUsers.$inferSelect;

/* The rest of the file below this comment remains unchanged except where noted */

export const projectLogs = pgTable(
  "project_logs",
  ({ text, timestamp }) => ({
    id: text("id")
      .primaryKey()
      .notNull()
      .unique()
      .default(sql`generate_custom_id('pl_')`),
    projectId: text("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    threadId: text("thread_id").references(() => threads.id), // nullable
    timestamp: timestamp("timestamp", { withTimezone: true })
      .default(sql`clock_timestamp()`)
      .notNull(),
    level: text("level", {
      enum: Object.values<string>(LogLevel) as [LogLevel],
    }).notNull(),
    message: text("message").notNull(),
    metadata: customJsonb<Record<string, unknown>>("metadata"),
  }),
  (table) => [
    index("project_logs_project_idx").on(table.projectId),
    index("project_logs_timestamp_idx").on(table.timestamp),
  ],
);

export type DBProjectLog = typeof projectLogs.$inferSelect;
