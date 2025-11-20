CREATE INDEX "threads_project_updated_idx" ON "threads" USING btree ("project_id","updated_at");--> statement-breakpoint
CREATE INDEX "threads_updated_at_idx" ON "threads" USING btree ("updated_at");