DO $$ BEGIN
 CREATE TYPE "public"."return_status" AS ENUM('returned', 'damaged', 'lost');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD COLUMN "return_status" "return_status";--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD COLUMN "return_notes" text;--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD COLUMN "estimated_return_at" timestamp with time zone;