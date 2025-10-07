ALTER TABLE "messages" ADD COLUMN "parent_message_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_id_uniq" UNIQUE("thread_id","id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_parent_same_thread_fk" FOREIGN KEY ("thread_id","parent_message_id") REFERENCES "public"."messages"("thread_id","id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "messages_parent_message_id_idx" ON "messages" USING btree ("parent_message_id");--> statement-breakpoint
CREATE INDEX "messages_thread_id_parent_message_id_idx" ON "messages" USING btree ("thread_id","parent_message_id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "chk_messages_parent_not_self" CHECK ("messages"."parent_message_id" IS NULL OR "messages"."parent_message_id" <> "messages"."id");