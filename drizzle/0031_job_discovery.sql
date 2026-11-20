CREATE TABLE "job_board_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"token" text NOT NULL,
	"company_name" text NOT NULL,
	"posting_count" integer DEFAULT 0 NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"duplicate_of_id" uuid,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"location" text,
	"work_arrangement" "work_arrangement" DEFAULT 'NOT_SPECIFIED' NOT NULL,
	"employment_type" "employment_type" DEFAULT 'NOT_SPECIFIED' NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"currency" text,
	"description" text NOT NULL,
	"url" text NOT NULL,
	"apply_url" text,
	"posted_at" timestamp with time zone,
	"sort_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_board_follows" ADD CONSTRAINT "job_board_follows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_board_follows" ADD CONSTRAINT "job_board_follows_board_id_job_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."job_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_board_id_job_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."job_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_board_follows_user_board_idx" ON "job_board_follows" USING btree ("user_id","board_id");--> statement-breakpoint
CREATE INDEX "job_board_follows_board_idx" ON "job_board_follows" USING btree ("board_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_boards_public_id_idx" ON "job_boards" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_boards_source_token_idx" ON "job_boards" USING btree ("source","token");--> statement-breakpoint
CREATE INDEX "job_boards_last_fetched_idx" ON "job_boards" USING btree ("last_fetched_at");--> statement-breakpoint
CREATE UNIQUE INDEX "job_postings_public_id_idx" ON "job_postings" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_postings_board_source_idx" ON "job_postings" USING btree ("board_id","source_id");--> statement-breakpoint
CREATE INDEX "job_postings_dedupe_idx" ON "job_postings" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "job_postings_board_feed_idx" ON "job_postings" USING btree ("board_id","expired_at","sort_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "job_postings_expired_idx" ON "job_postings" USING btree ("expired_at");