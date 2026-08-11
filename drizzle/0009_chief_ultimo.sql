CREATE TYPE "public"."document_activity_kind" AS ENUM('CREATED', 'EDITED', 'ADDED_TO_LIBRARY');--> statement-breakpoint
CREATE TABLE "document_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"kind" "document_activity_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_activities" ADD CONSTRAINT "document_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_activities" ADD CONSTRAINT "document_activities_document_id_generated_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."generated_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_activities_document_idx" ON "document_activities" USING btree ("document_id","created_at");