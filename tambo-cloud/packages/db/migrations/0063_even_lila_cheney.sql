--> statement-breakpoint
ALTER TABLE "tambo_users" ADD COLUMN "legal_accepted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tambo_users" ADD COLUMN "legal_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tambo_users" ADD COLUMN "legal_version" text;--> statement-breakpoint
CREATE INDEX "idx_tambo_users_legal_accepted" ON "tambo_users" USING btree ("legal_accepted");--> statement-breakpoint