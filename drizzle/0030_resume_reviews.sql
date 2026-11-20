ALTER TYPE "public"."usage_action" ADD VALUE 'RESUME_REVIEW';--> statement-breakpoint
CREATE TABLE "resume_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"analysis_id" uuid NOT NULL,
	"input_hash" text NOT NULL,
	"verdict" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"result_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resume_reviews" ADD CONSTRAINT "resume_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_reviews" ADD CONSTRAINT "resume_reviews_analysis_id_application_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."application_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "resume_reviews_user_input_hash_idx" ON "resume_reviews" USING btree ("user_id","input_hash");--> statement-breakpoint
CREATE INDEX "resume_reviews_analysis_created_idx" ON "resume_reviews" USING btree ("analysis_id","created_at" DESC NULLS LAST);