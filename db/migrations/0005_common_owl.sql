ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "lockout_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_failed_attempts" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "lockout_duration_minutes" integer DEFAULT 60 NOT NULL;