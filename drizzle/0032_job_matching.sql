ALTER TYPE "public"."usage_action" ADD VALUE 'JOB_MATCHING';--> statement-breakpoint
CREATE TABLE "job_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"posting_id" uuid NOT NULL,
	"input_hash" text NOT NULL,
	"verdict" text NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score" integer,
	"rank" integer,
	"fit" text,
	"insight" jsonb,
	"scored_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_posting_id_job_postings_id_fk" FOREIGN KEY ("posting_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_matches_public_id_idx" ON "job_matches" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_matches_user_posting_idx" ON "job_matches" USING btree ("user_id","posting_id");--> statement-breakpoint
CREATE INDEX "job_matches_user_rank_idx" ON "job_matches" USING btree ("user_id","rank" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "job_matches_posting_idx" ON "job_matches" USING btree ("posting_id");