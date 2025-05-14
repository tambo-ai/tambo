CREATE TABLE "mcp_oauth_clients" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('moc_') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"project_id" text NOT NULL,
	"client_information" jsonb NOT NULL,
	CONSTRAINT "mcp_oauth_clients_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "mcp_oauth_clients" ADD CONSTRAINT "mcp_oauth_clients_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;