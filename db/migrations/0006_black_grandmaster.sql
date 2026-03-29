ALTER TABLE "users" ADD COLUMN "last_login_country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_latitude" real;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_longitude" real;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "require_location_for_auth" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "allowed_countries" text[] DEFAULT '{}' NOT NULL;