ALTER TABLE "messages" ADD COLUMN "sdk_version" text;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "sdk_version" text;--> statement-breakpoint
CREATE INDEX "messages_sdk_version_idx" ON "messages" USING btree ("sdk_version");--> statement-breakpoint
CREATE INDEX "threads_sdk_version_idx" ON "threads" USING btree ("sdk_version");