DO $$ BEGIN
 CREATE TYPE "public"."item_type" AS ENUM('consumable', 'reusable');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "type" "item_type" DEFAULT 'consumable' NOT NULL;