ALTER TABLE "generated_documents" ADD COLUMN "edited_resume_json" jsonb;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD COLUMN "edit_version" integer DEFAULT 0 NOT NULL;