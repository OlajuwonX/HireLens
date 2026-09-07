ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "purge_after" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "users_purge_after_idx" ON "users" USING btree ("purge_after") WHERE "users"."purge_after" is not null;