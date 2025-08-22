CREATE INDEX "api_keys_project_id_idx" ON "api_keys" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "api_keys_created_by_user_id_idx" ON "api_keys" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "mcp_oauth_clients_tool_provider_user_context_id_idx" ON "mcp_oauth_clients" USING btree ("tool_provider_user_context_id");--> statement-breakpoint
CREATE INDEX "project_logs_thread_idx" ON "project_logs" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "projects_creator_id_idx" ON "projects" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "provider_keys_project_id_idx" ON "provider_keys" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tool_provider_user_contexts_tool_provider_id_idx" ON "tool_provider_user_contexts" USING btree ("tool_provider_id");--> statement-breakpoint
CREATE INDEX "tool_providers_project_id_idx" ON "tool_providers" USING btree ("project_id");