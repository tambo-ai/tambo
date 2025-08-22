CREATE INDEX "messages_thread_id_idx" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "suggestions_message_id_idx" ON "suggestions" USING btree ("message_id");