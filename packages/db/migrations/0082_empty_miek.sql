CREATE TABLE "bearer_tokens" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('bt_') NOT NULL,
	"user_id" uuid NOT NULL,
	"hashed_token" text NOT NULL,
	"device_session_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "bearer_tokens_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "device_auth_sessions" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('das_') NOT NULL,
	"device_code" text NOT NULL,
	"user_code" text NOT NULL,
	"user_id" uuid,
	"is_used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_auth_sessions_id_unique" UNIQUE("id"),
	CONSTRAINT "device_auth_sessions_device_code_unique" UNIQUE("device_code"),
	CONSTRAINT "device_auth_sessions_user_code_unique" UNIQUE("user_code")
);
--> statement-breakpoint
ALTER TABLE "bearer_tokens" ADD CONSTRAINT "bearer_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bearer_tokens" ADD CONSTRAINT "bearer_tokens_device_session_id_device_auth_sessions_id_fk" FOREIGN KEY ("device_session_id") REFERENCES "public"."device_auth_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_auth_sessions" ADD CONSTRAINT "device_auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bearer_tokens_user_id_idx" ON "bearer_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bearer_tokens_hashed_token_idx" ON "bearer_tokens" USING btree ("hashed_token");--> statement-breakpoint
CREATE INDEX "bearer_tokens_device_session_id_idx" ON "bearer_tokens" USING btree ("device_session_id");--> statement-breakpoint
CREATE INDEX "bearer_tokens_expires_at_idx" ON "bearer_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "device_auth_sessions_device_code_idx" ON "device_auth_sessions" USING btree ("device_code");--> statement-breakpoint
CREATE INDEX "device_auth_sessions_user_code_idx" ON "device_auth_sessions" USING btree ("user_code");--> statement-breakpoint
CREATE INDEX "device_auth_sessions_user_id_idx" ON "device_auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "device_auth_sessions_expires_at_idx" ON "device_auth_sessions" USING btree ("expires_at");