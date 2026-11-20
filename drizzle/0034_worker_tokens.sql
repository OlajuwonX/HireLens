CREATE TABLE "worker_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "worker_tokens" ADD CONSTRAINT "worker_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "worker_tokens_public_id_idx" ON "worker_tokens" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "worker_tokens_hash_idx" ON "worker_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "worker_tokens_user_idx" ON "worker_tokens" USING btree ("user_id");