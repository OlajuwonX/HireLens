CREATE TABLE "user_evidence_corrections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"analysis_id" uuid NOT NULL,
	"requirement_key" text NOT NULL,
	"requirement" text NOT NULL,
	"marked_incorrect" boolean DEFAULT false NOT NULL,
	"evidence" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_evidence_corrections" ADD CONSTRAINT "user_evidence_corrections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_evidence_corrections" ADD CONSTRAINT "user_evidence_corrections_analysis_id_application_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."application_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_evidence_corrections_user_idx" ON "user_evidence_corrections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_evidence_corrections_analysis_requirement_idx" ON "user_evidence_corrections" USING btree ("analysis_id","requirement_key");