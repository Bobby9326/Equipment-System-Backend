ALTER TABLE "equipment" DROP CONSTRAINT "equipment_equipment_code_unique";--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "equipment_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_equipment_number_unique" UNIQUE("equipment_number");