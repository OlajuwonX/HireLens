ALTER TYPE "public"."usage_action" ADD VALUE 'IMPROVED_RESUME';--> statement-breakpoint
ALTER TYPE "public"."usage_action" ADD VALUE 'PROFESSIONAL_SUMMARY';--> statement-breakpoint
ALTER TYPE "public"."usage_action" ADD VALUE 'KEYWORD_ANALYSIS';--> statement-breakpoint
ALTER TYPE "public"."usage_action" ADD VALUE 'BULLET_REWRITE';--> statement-breakpoint
ALTER TYPE "public"."usage_action" ADD VALUE 'FOLLOW_UP_MESSAGE';--> statement-breakpoint
CREATE UNIQUE INDEX "ai_usage_reservations_one_active_idx"
ON "ai_usage_reservations" ("user_id")
WHERE "completed_at" IS NULL AND "failed_at" IS NULL;
