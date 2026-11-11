CREATE TABLE "candidate_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_key" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"headline" text,
	"seniority" text,
	"years_experience" integer,
	"current_location" text,
	"target_roles" text[] DEFAULT '{}'::text[] NOT NULL,
	"target_locations" text[] DEFAULT '{}'::text[] NOT NULL,
	"work_arrangements" "work_arrangement"[] DEFAULT '{}'::work_arrangement[] NOT NULL,
	"authorized_countries" text[] DEFAULT '{}'::text[] NOT NULL,
	"requires_sponsorship" boolean,
	"willing_to_relocate" boolean,
	"salary_min" integer,
	"salary_currency" text,
	"notice_period_weeks" integer,
	"phone" text,
	"linkedin_url" text,
	"github_url" text,
	"portfolio_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_answers" ADD CONSTRAINT "candidate_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_answers_public_id_idx" ON "candidate_answers" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_answers_user_question_idx" ON "candidate_answers" USING btree ("user_id","question_key");--> statement-breakpoint
CREATE INDEX "candidate_answers_user_updated_idx" ON "candidate_answers" USING btree ("user_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_profiles_user_idx" ON "candidate_profiles" USING btree ("user_id");