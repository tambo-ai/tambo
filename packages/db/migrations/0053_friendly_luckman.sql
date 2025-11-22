ALTER TABLE "projects" ADD COLUMN "oauth_validation_mode" text DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "oauth_secret_key_encrypted" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "oauth_public_key" text;