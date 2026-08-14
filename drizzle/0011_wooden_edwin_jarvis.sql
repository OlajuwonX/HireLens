CREATE TYPE "public"."bug_category" AS ENUM('BUG', 'AI_ISSUE', 'PERFORMANCE', 'UPLOAD', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."bug_status" AS ENUM('OPEN', 'IN_REVIEW', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "bug_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "bug_category" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"route" text NOT NULL,
	"sentry_event_id" text,
	"status" "bug_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'USER' NOT NULL;--> statement-breakpoint
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bug_reports_public_id_idx" ON "bug_reports" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "bug_reports_user_created_idx" ON "bug_reports" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "bug_reports_status_created_idx" ON "bug_reports" USING btree ("status","created_at");