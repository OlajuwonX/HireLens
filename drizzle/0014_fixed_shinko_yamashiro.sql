ALTER TABLE "generated_documents" ADD COLUMN "resume_template" text DEFAULT 'CLASSIC' NOT NULL;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD COLUMN "resume_typography" text DEFAULT 'INTER' NOT NULL;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD COLUMN "resume_spacing" text DEFAULT 'STANDARD' NOT NULL;