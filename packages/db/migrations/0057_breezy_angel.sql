CREATE TABLE "welcome_email_tracking" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('wet_') NOT NULL,
	"user_id" uuid NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "welcome_email_tracking_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "welcome_email_tracking" ADD CONSTRAINT "welcome_email_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_welcome_email_tracking_sent_at" ON "welcome_email_tracking" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_welcome_email_tracking_user_id" ON "welcome_email_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_welcome_email_tracking_email_sent" ON "welcome_email_tracking" USING btree ("email_sent");