ALTER TABLE "mcp_thread_session" DROP CONSTRAINT "mcp_thread_session_thread_id_threads_id_fk";
--> statement-breakpoint
ALTER TABLE "mcp_thread_session" DROP CONSTRAINT "mcp_thread_session_tool_provider_id_tool_providers_id_fk";
--> statement-breakpoint
ALTER TABLE "mcp_thread_session" ADD CONSTRAINT "mcp_thread_session_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "mcp_thread_session" ADD CONSTRAINT "mcp_thread_session_tool_provider_id_tool_providers_id_fk" FOREIGN KEY ("tool_provider_id") REFERENCES "public"."tool_providers"("id") ON DELETE cascade ON UPDATE cascade;