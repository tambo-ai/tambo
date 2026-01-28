CREATE INDEX "threads_project_id_idx" ON "threads" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "threads_created_at_idx" ON "threads" USING btree ("created_at");