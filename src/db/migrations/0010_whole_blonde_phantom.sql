ALTER TABLE "equipment" DROP CONSTRAINT "equipment_activity_id_activities_id_fk";
--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "activity" varchar(255);--> statement-breakpoint
ALTER TABLE "equipment" DROP COLUMN "activity_id";