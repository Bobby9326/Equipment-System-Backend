ALTER TABLE "mhesi_numbers" DROP CONSTRAINT "mhesi_numbers_support_unit_id_support_units_id_fk";
--> statement-breakpoint
ALTER TABLE "mhesi_numbers" ADD COLUMN "faculty" varchar(255);--> statement-breakpoint
ALTER TABLE "mhesi_numbers" DROP COLUMN "support_unit_id";