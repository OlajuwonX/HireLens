CREATE TABLE "application_task_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"from_state" text,
	"to_state" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"state" text DEFAULT 'QUALIFIED' NOT NULL,
	"state_reason" text,
	"needs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"platform" text,
	"role_key" text NOT NULL,
	"approved_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"confirmation" jsonb,
	"lease_owner" text,
	"lease_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_task_events" ADD CONSTRAINT "application_task_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_task_events" ADD CONSTRAINT "application_task_events_task_id_application_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."application_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_tasks" ADD CONSTRAINT "application_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_tasks" ADD CONSTRAINT "application_tasks_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_task_events_task_created_idx" ON "application_task_events" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "application_tasks_public_id_idx" ON "application_tasks" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "application_tasks_application_idx" ON "application_tasks" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_tasks_user_state_idx" ON "application_tasks" USING btree ("user_id","state");--> statement-breakpoint
CREATE INDEX "application_tasks_user_role_idx" ON "application_tasks" USING btree ("user_id","role_key");--> statement-breakpoint
CREATE INDEX "application_tasks_user_submitted_idx" ON "application_tasks" USING btree ("user_id","submitted_at");