ALTER TYPE "public"."usage_action" ADD VALUE 'INTERVIEW_PREP';--> statement-breakpoint
CREATE TABLE "email_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"message_id" text NOT NULL,
	"thread_id" text,
	"from_address" text NOT NULL,
	"subject" text NOT NULL,
	"snippet" text NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"kind" text NOT NULL,
	"confidence" integer NOT NULL,
	"status" text NOT NULL,
	"application_id" uuid,
	"match_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_preps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"email_event_id" uuid,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"result_json" jsonb,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_preps" ADD CONSTRAINT "interview_preps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_preps" ADD CONSTRAINT "interview_preps_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_preps" ADD CONSTRAINT "interview_preps_email_event_id_email_events_id_fk" FOREIGN KEY ("email_event_id") REFERENCES "public"."email_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_events_public_id_idx" ON "email_events" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_events_user_message_idx" ON "email_events" USING btree ("user_id","message_id");--> statement-breakpoint
CREATE INDEX "email_events_user_received_idx" ON "email_events" USING btree ("user_id","received_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "email_events_user_status_idx" ON "email_events" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "interview_preps_public_id_idx" ON "interview_preps" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "interview_preps_application_idx" ON "interview_preps" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "interview_preps_user_idx" ON "interview_preps" USING btree ("user_id","updated_at" DESC NULLS LAST);