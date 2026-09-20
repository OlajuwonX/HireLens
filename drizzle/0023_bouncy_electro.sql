CREATE TABLE "admin_impersonation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_impersonation_sessions" ADD CONSTRAINT "admin_impersonation_sessions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_impersonation_sessions" ADD CONSTRAINT "admin_impersonation_sessions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_impersonation_sessions_public_id_idx" ON "admin_impersonation_sessions" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "admin_impersonation_sessions_actor_idx" ON "admin_impersonation_sessions" USING btree ("actor_user_id","started_at");--> statement-breakpoint
CREATE INDEX "admin_impersonation_sessions_target_idx" ON "admin_impersonation_sessions" USING btree ("target_user_id");