ALTER TABLE "tool_provider_user_contexts" DROP CONSTRAINT "tool_provider_user_contexts_tool_provider_id_tool_providers_id_fk";
--> statement-breakpoint
ALTER TABLE "tool_provider_user_contexts" ADD CONSTRAINT "tool_provider_user_contexts_tool_provider_id_tool_providers_id_fk" FOREIGN KEY ("tool_provider_id") REFERENCES "public"."tool_providers"("id") ON DELETE cascade ON UPDATE no action;