ALTER TABLE "projects" ALTER COLUMN "oauth_validation_mode" SET DEFAULT 'asymmetric_auto';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "oauth_validation_mode" SET NOT NULL;