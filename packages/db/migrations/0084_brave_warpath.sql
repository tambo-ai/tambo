CREATE TABLE "cli_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"browser_session_id" text,
	"not_after" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "device_auth_codes" RENAME COLUMN "session_id" TO "cli_session_id";--> statement-breakpoint
ALTER TABLE "device_auth_codes" DROP CONSTRAINT "device_auth_codes_session_id_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "cli_sessions" ADD CONSTRAINT "cli_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cli_sessions" ADD CONSTRAINT "cli_sessions_browser_session_id_sessions_id_fk" FOREIGN KEY ("browser_session_id") REFERENCES "auth"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cli_sessions_user_id_idx" ON "cli_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cli_sessions_not_after_idx" ON "cli_sessions" USING btree ("not_after");--> statement-breakpoint
ALTER TABLE "device_auth_codes" ADD CONSTRAINT "device_auth_codes_cli_session_id_cli_sessions_id_fk" FOREIGN KEY ("cli_session_id") REFERENCES "public"."cli_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" DROP COLUMN "source";