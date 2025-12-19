CREATE TABLE "device_auth_codes" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('dac_') NOT NULL,
	"device_code" text NOT NULL,
	"user_code" text NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"is_used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_auth_codes_id_unique" UNIQUE("id"),
	CONSTRAINT "device_auth_codes_device_code_unique" UNIQUE("device_code"),
	CONSTRAINT "device_auth_codes_user_code_unique" UNIQUE("user_code")
);
--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "source" text DEFAULT 'browser';--> statement-breakpoint
ALTER TABLE "device_auth_codes" ADD CONSTRAINT "device_auth_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_auth_codes" ADD CONSTRAINT "device_auth_codes_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "device_auth_codes_device_code_idx" ON "device_auth_codes" USING btree ("device_code");--> statement-breakpoint
CREATE INDEX "device_auth_codes_user_code_idx" ON "device_auth_codes" USING btree ("user_code");--> statement-breakpoint
CREATE INDEX "device_auth_codes_expires_at_idx" ON "device_auth_codes" USING btree ("expires_at");