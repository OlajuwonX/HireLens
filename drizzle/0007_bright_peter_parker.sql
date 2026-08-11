-- migration-check: allow drop-table analysis_suggestions is replaced by result_json.recommendations
-- migration-check: allow drop-table requirement_matches is replaced by result_json.requirementMatches
-- migration-check: allow drop-table resume_analyses is replaced by application_analyses
-- migration-check: allow drop-table user_evidence_corrections is recreated in the next migration keyed on the analysis and requirement key instead of a requirement_matches row
ALTER TABLE "analysis_suggestions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "requirement_matches" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resume_analyses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_evidence_corrections" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "analysis_suggestions" CASCADE;--> statement-breakpoint
DROP TABLE "requirement_matches" CASCADE;--> statement-breakpoint
DROP TABLE "resume_analyses" CASCADE;--> statement-breakpoint
DROP TABLE "user_evidence_corrections" CASCADE;--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_analysis_id_resume_analyses_id_fk";
--> statement-breakpoint
UPDATE "applications" SET "analysis_id" = NULL WHERE "analysis_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_analysis_id_application_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."application_analyses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."analysis_type";--> statement-breakpoint
DROP TYPE "public"."requirement_category";--> statement-breakpoint
DROP TYPE "public"."requirement_importance";--> statement-breakpoint
DROP TYPE "public"."requirement_match_status";--> statement-breakpoint
DROP TYPE "public"."suggestion_severity";