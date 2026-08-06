CREATE TYPE "public"."analysis_status" AS ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."analysis_type" AS ENUM('GENERAL', 'JOB_SPECIFIC');--> statement-breakpoint
CREATE TYPE "public"."application_stage" AS ENUM('SAVED', 'PREPARING', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('COVER_LETTER', 'APPLICATION_EMAIL', 'EMAIL_SUBJECT', 'LINKEDIN_MESSAGE', 'FOLLOW_UP_EMAIL', 'THANK_YOU_EMAIL', 'PROFESSIONAL_INTRO', 'CAREER_CHANGE_EXPLANATION', 'ENTRY_LEVEL_NOTE');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY', 'FREELANCE', 'NOT_SPECIFIED');--> statement-breakpoint
CREATE TYPE "public"."file_asset_kind" AS ENUM('RESUME_PDF', 'RESUME_PREVIEW', 'GENERATED_DOCUMENT');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('SAVED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."requirement_category" AS ENUM('SKILL', 'EXPERIENCE', 'EDUCATION', 'CERTIFICATION', 'RESPONSIBILITY', 'LOCATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."requirement_importance" AS ENUM('REQUIRED', 'PREFERRED');--> statement-breakpoint
CREATE TYPE "public"."requirement_match_status" AS ENUM('STRONG', 'PARTIAL', 'MISSING', 'UNCLEAR');--> statement-breakpoint
CREATE TYPE "public"."resume_status" AS ENUM('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."suggestion_severity" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."usage_action" AS ENUM('GENERAL_ANALYSIS', 'JOB_ANALYSIS', 'COVER_LETTER', 'APPLICATION_MESSAGE');--> statement-breakpoint
CREATE TYPE "public"."usage_status" AS ENUM('RESERVED', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."work_arrangement" AS ENUM('REMOTE', 'HYBRID', 'ON_SITE', 'NOT_SPECIFIED');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "usage_action" NOT NULL,
	"status" "usage_status" NOT NULL,
	"provider" text,
	"model" text,
	"input_hash" text,
	"cost_units" integer,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "usage_action" NOT NULL,
	"reserved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"analysis_id" uuid NOT NULL,
	"category" text NOT NULL,
	"severity" "suggestion_severity" NOT NULL,
	"problem" text NOT NULL,
	"reason" text NOT NULL,
	"action" text NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"resume_version_id" uuid,
	"analysis_id" uuid,
	"stage" "application_stage" DEFAULT 'SAVED' NOT NULL,
	"applied_at" timestamp with time zone,
	"follow_up_at" timestamp with time zone,
	"interview_at" timestamp with time zone,
	"notes" text,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "file_asset_kind" NOT NULL,
	"storage_provider" text NOT NULL,
	"storage_key" text NOT NULL,
	"original_filename" text,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "document_type" NOT NULL,
	"job_id" uuid,
	"application_id" uuid,
	"resume_version_id" uuid,
	"prompt_version" text NOT NULL,
	"original_content" text NOT NULL,
	"edited_content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"location" text,
	"work_arrangement" "work_arrangement" DEFAULT 'NOT_SPECIFIED' NOT NULL,
	"employment_type" "employment_type" DEFAULT 'NOT_SPECIFIED' NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"currency" text,
	"source" text,
	"source_url" text,
	"description" text NOT NULL,
	"requirements" text,
	"deadline_at" timestamp with time zone,
	"notes" text,
	"status" "job_status" DEFAULT 'SAVED' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"analysis_id" uuid NOT NULL,
	"requirement" text NOT NULL,
	"category" "requirement_category" NOT NULL,
	"importance" "requirement_importance" NOT NULL,
	"status" "requirement_match_status" NOT NULL,
	"resume_evidence" text,
	"explanation" text NOT NULL,
	"recommendation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resume_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resume_version_id" uuid NOT NULL,
	"job_id" uuid,
	"type" "analysis_type" NOT NULL,
	"status" "analysis_status" DEFAULT 'PENDING' NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"input_hash" text NOT NULL,
	"raw_response" jsonb,
	"normalized_result" jsonb,
	"overall_score" integer,
	"ats_score" integer,
	"duration_ms" integer,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resume_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resume_id" uuid NOT NULL,
	"file_asset_id" uuid NOT NULL,
	"preview_asset_id" uuid,
	"label" text NOT NULL,
	"extracted_text" text,
	"version_number" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "resume_status" DEFAULT 'UPLOADING' NOT NULL,
	"default_version_id" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_evidence_corrections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"requirement_match_id" uuid NOT NULL,
	"marked_incorrect" boolean DEFAULT false NOT NULL,
	"evidence" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"default_resume_id" uuid,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"reduced_motion" boolean DEFAULT false NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"image" text,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_reservations" ADD CONSTRAINT "ai_usage_reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_suggestions" ADD CONSTRAINT "analysis_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_suggestions" ADD CONSTRAINT "analysis_suggestions_analysis_id_resume_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."resume_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_activities" ADD CONSTRAINT "application_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_activities" ADD CONSTRAINT "application_activities_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_resume_version_id_resume_versions_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_analysis_id_resume_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."resume_analyses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_resume_version_id_resume_versions_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_matches" ADD CONSTRAINT "requirement_matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_matches" ADD CONSTRAINT "requirement_matches_analysis_id_resume_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."resume_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_resume_version_id_resume_versions_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_file_asset_id_file_assets_id_fk" FOREIGN KEY ("file_asset_id") REFERENCES "public"."file_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_preview_asset_id_file_assets_id_fk" FOREIGN KEY ("preview_asset_id") REFERENCES "public"."file_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_evidence_corrections" ADD CONSTRAINT "user_evidence_corrections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_evidence_corrections" ADD CONSTRAINT "user_evidence_corrections_requirement_match_id_requirement_matches_id_fk" FOREIGN KEY ("requirement_match_id") REFERENCES "public"."requirement_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_default_resume_id_resumes_id_fk" FOREIGN KEY ("default_resume_id") REFERENCES "public"."resumes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_idx" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_usage_events_user_action_created_idx" ON "ai_usage_events" USING btree ("user_id","action","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_events_user_status_idx" ON "ai_usage_events" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "ai_usage_reservations_user_action_idx" ON "ai_usage_reservations" USING btree ("user_id","action");--> statement-breakpoint
CREATE INDEX "ai_usage_reservations_active_idx" ON "ai_usage_reservations" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "analysis_suggestions_analysis_idx" ON "analysis_suggestions" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "analysis_suggestions_user_severity_idx" ON "analysis_suggestions" USING btree ("user_id","severity");--> statement-breakpoint
CREATE INDEX "application_activities_application_idx" ON "application_activities" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_activities_user_created_idx" ON "application_activities" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_public_id_idx" ON "applications" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "applications_user_stage_idx" ON "applications" USING btree ("user_id","stage");--> statement-breakpoint
CREATE INDEX "applications_user_follow_up_idx" ON "applications" USING btree ("user_id","follow_up_at");--> statement-breakpoint
CREATE UNIQUE INDEX "file_assets_public_id_idx" ON "file_assets" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "file_assets_storage_key_idx" ON "file_assets" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "file_assets_user_kind_idx" ON "file_assets" USING btree ("user_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "generated_documents_public_id_idx" ON "generated_documents" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "generated_documents_user_type_idx" ON "generated_documents" USING btree ("user_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_public_id_idx" ON "jobs" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "jobs_user_status_created_idx" ON "jobs" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "jobs_user_title_company_idx" ON "jobs" USING btree ("user_id","title","company");--> statement-breakpoint
CREATE INDEX "requirement_matches_analysis_idx" ON "requirement_matches" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "requirement_matches_user_status_idx" ON "requirement_matches" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "resume_analyses_public_id_idx" ON "resume_analyses" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "resume_analyses_user_input_hash_idx" ON "resume_analyses" USING btree ("user_id","input_hash");--> statement-breakpoint
CREATE INDEX "resume_analyses_user_status_idx" ON "resume_analyses" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "resume_versions_public_id_idx" ON "resume_versions" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "resume_versions_resume_number_idx" ON "resume_versions" USING btree ("resume_id","version_number");--> statement-breakpoint
CREATE INDEX "resume_versions_user_resume_idx" ON "resume_versions" USING btree ("user_id","resume_id");--> statement-breakpoint
CREATE UNIQUE INDEX "resumes_public_id_idx" ON "resumes" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "resumes_user_status_created_idx" ON "resumes" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_idx" ON "sessions" USING btree ("session_token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_evidence_corrections_user_idx" ON "user_evidence_corrections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_evidence_corrections_requirement_idx" ON "user_evidence_corrections" USING btree ("requirement_match_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_preferences_user_idx" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_public_id_idx" ON "users" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_tokens_identifier_token_idx" ON "verification_tokens" USING btree ("identifier","token_hash");