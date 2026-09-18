CREATE TABLE "admin_error_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" text NOT NULL,
	"sentry_event_id" text,
	"title" text NOT NULL,
	"level" text,
	"culprit" text,
	"environment" text,
	"event_count" integer DEFAULT 1 NOT NULL,
	"first_seen" timestamp with time zone,
	"last_seen" timestamp with time zone,
	"permalink" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "admin_error_events_issue_id_idx" ON "admin_error_events" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "admin_error_events_last_seen_idx" ON "admin_error_events" USING btree ("last_seen");