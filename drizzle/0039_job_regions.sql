ALTER TABLE "candidate_profiles" ADD COLUMN "job_regions" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "job_boards" ADD COLUMN "region" text;