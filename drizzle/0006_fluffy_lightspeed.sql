ALTER TYPE "public"."usage_action" ADD VALUE 'APPLICATION_ANALYSIS' BEFORE 'GENERAL_ANALYSIS';--> statement-breakpoint
ALTER TYPE "public"."usage_action" ADD VALUE 'APPLICATION_REGENERATE' BEFORE 'GENERAL_ANALYSIS';--> statement-breakpoint
CREATE TABLE "application_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid,
	"resume_version_id" uuid NOT NULL,
	"job_id" uuid,
	"status" "analysis_status" DEFAULT 'PENDING' NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"input_hash" text NOT NULL,
	"result_json" jsonb,
	"raw_response" jsonb,
	"overall_score" integer,
	"ats_score" integer,
	"duration_ms" integer,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_analyses" ADD CONSTRAINT "application_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_analyses" ADD CONSTRAINT "application_analyses_resume_version_id_resume_versions_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_analyses" ADD CONSTRAINT "application_analyses_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "application_analyses_public_id_idx" ON "application_analyses" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "application_analyses_user_input_hash_idx" ON "application_analyses" USING btree ("user_id","input_hash");--> statement-breakpoint
CREATE INDEX "application_analyses_user_status_idx" ON "application_analyses" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "application_analyses_application_idx" ON "application_analyses" USING btree ("application_id");