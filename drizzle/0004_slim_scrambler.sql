ALTER TYPE "public"."document_type" ADD VALUE 'IMPROVED_RESUME' BEFORE 'COVER_LETTER';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'PROFESSIONAL_SUMMARY' BEFORE 'EMAIL_SUBJECT';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'KEYWORD_ANALYSIS' BEFORE 'EMAIL_SUBJECT';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'BULLET_REWRITE' BEFORE 'EMAIL_SUBJECT';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'FOLLOW_UP_MESSAGE' BEFORE 'EMAIL_SUBJECT';--> statement-breakpoint
ALTER TABLE "generated_documents" ADD COLUMN "file_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_file_asset_id_file_assets_id_fk" FOREIGN KEY ("file_asset_id") REFERENCES "public"."file_assets"("id") ON DELETE set null ON UPDATE no action;