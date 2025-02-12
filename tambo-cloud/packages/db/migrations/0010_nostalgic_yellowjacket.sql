CREATE TABLE "suggestions" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('sug_') NOT NULL,
	"message_id" text NOT NULL,
	"title" text NOT NULL,
	"detailed_suggestion" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "suggestions_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tool_call_request" jsonb;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;