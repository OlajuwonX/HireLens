CREATE TYPE "public"."interview_difficulty" AS ENUM('EASY', 'CHALLENGING', 'HARD', 'VERY_HARD');--> statement-breakpoint
CREATE TYPE "public"."interview_pool_status" AS ENUM('PENDING', 'READY', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."interview_question_bucket" AS ENUM('DAILY', 'PRACTICE');--> statement-breakpoint
CREATE TABLE "interview_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_option" integer NOT NULL,
	"is_correct" boolean NOT NULL,
	"difficulty" "interview_difficulty" NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_question_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text NOT NULL,
	"role_family" text NOT NULL,
	"seniority_band" text NOT NULL,
	"core_skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prompt_version" text NOT NULL,
	"pool_version" integer DEFAULT 1 NOT NULL,
	"status" "interview_pool_status" DEFAULT 'PENDING' NOT NULL,
	"provider" text,
	"model" text,
	"question_count" integer DEFAULT 0 NOT NULL,
	"generation_duration_ms" integer,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"pool_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_option" integer NOT NULL,
	"explanation" text NOT NULL,
	"difficulty" "interview_difficulty" NOT NULL,
	"topic" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_interview_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pool_id" uuid NOT NULL,
	"week_start" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"readiness_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_interview_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"bucket" "interview_question_bucket" NOT NULL,
	"day_index" integer,
	"assigned_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interview_attempts" ADD CONSTRAINT "interview_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_attempts" ADD CONSTRAINT "interview_attempts_cycle_id_user_interview_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."user_interview_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_attempts" ADD CONSTRAINT "interview_attempts_question_id_interview_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."interview_questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_pool_id_interview_question_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."interview_question_pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interview_cycles" ADD CONSTRAINT "user_interview_cycles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interview_cycles" ADD CONSTRAINT "user_interview_cycles_pool_id_interview_question_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."interview_question_pools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interview_questions" ADD CONSTRAINT "user_interview_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interview_questions" ADD CONSTRAINT "user_interview_questions_cycle_id_user_interview_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."user_interview_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interview_questions" ADD CONSTRAINT "user_interview_questions_question_id_interview_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."interview_questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "interview_attempts_public_id_idx" ON "interview_attempts" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "interview_attempts_cycle_question_idx" ON "interview_attempts" USING btree ("cycle_id","question_id");--> statement-breakpoint
CREATE INDEX "interview_attempts_user_cycle_idx" ON "interview_attempts" USING btree ("user_id","cycle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "interview_question_pools_public_id_idx" ON "interview_question_pools" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "interview_question_pools_pending_fingerprint_idx" ON "interview_question_pools" USING btree ("fingerprint") WHERE "interview_question_pools"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "interview_question_pools_fingerprint_status_idx" ON "interview_question_pools" USING btree ("fingerprint","status");--> statement-breakpoint
CREATE INDEX "interview_question_pools_role_status_idx" ON "interview_question_pools" USING btree ("role_family","seniority_band","status");--> statement-breakpoint
CREATE UNIQUE INDEX "interview_questions_public_id_idx" ON "interview_questions" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "interview_questions_pool_order_idx" ON "interview_questions" USING btree ("pool_id","order_index");--> statement-breakpoint
CREATE INDEX "interview_questions_pool_difficulty_idx" ON "interview_questions" USING btree ("pool_id","difficulty");--> statement-breakpoint
CREATE UNIQUE INDEX "user_interview_cycles_public_id_idx" ON "user_interview_cycles" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_interview_cycles_user_week_idx" ON "user_interview_cycles" USING btree ("user_id","week_start");--> statement-breakpoint
CREATE INDEX "user_interview_cycles_user_closed_idx" ON "user_interview_cycles" USING btree ("user_id","closed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_interview_questions_cycle_question_idx" ON "user_interview_questions" USING btree ("cycle_id","question_id");--> statement-breakpoint
CREATE INDEX "user_interview_questions_cycle_bucket_idx" ON "user_interview_questions" USING btree ("cycle_id","bucket","day_index");--> statement-breakpoint
CREATE INDEX "user_interview_questions_user_idx" ON "user_interview_questions" USING btree ("user_id");