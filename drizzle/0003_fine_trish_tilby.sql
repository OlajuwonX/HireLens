-- migration-check: allow drop-type application_stage was recreated in this same migration and this file is already applied to the only database; HireLens had no production traffic at the time
-- migration-check: allow change-type applications table is empty (0 rows) and HireLens is pre-production, so no deployed writer holds the old seven-stage values
ALTER TABLE "applications" ALTER COLUMN "stage" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "stage" SET DEFAULT 'PENDING'::text;--> statement-breakpoint
DROP TYPE "public"."application_stage";--> statement-breakpoint
CREATE TYPE "public"."application_stage" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "stage" SET DEFAULT 'PENDING'::"public"."application_stage";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "stage" SET DATA TYPE "public"."application_stage" USING "stage"::"public"."application_stage";
