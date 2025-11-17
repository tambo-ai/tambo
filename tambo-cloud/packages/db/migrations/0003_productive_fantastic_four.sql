CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('hk_') NOT NULL,
	"name" text NOT NULL,
	"hashed_key" text NOT NULL,
	"partially_hidden_key" text NOT NULL,
	"project_id" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "api_keys_id_unique" UNIQUE("id")
);

--> statement-breakpoint
CREATE TABLE "provider_keys" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('pvk_') NOT NULL,
	"project_id" text NOT NULL,
	"provider_name" text NOT NULL,
	"provider_key_encrypted" text NOT NULL,
	"partially_hidden_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "provider_keys_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_keys" ADD CONSTRAINT "provider_keys_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;