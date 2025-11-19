ALTER TABLE "projects" ADD COLUMN "default_llm_provider_name" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "default_llm_model_name" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "custom_llm_model_name" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "custom_llm_base_url" text;
