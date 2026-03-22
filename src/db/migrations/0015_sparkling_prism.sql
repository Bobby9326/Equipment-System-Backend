ALTER TABLE "projects" DROP CONSTRAINT "projects_project_type_id_project_types_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "fiscal_year" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "acquisition_method_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_type_id_equipment_types_id_fk" FOREIGN KEY ("project_type_id") REFERENCES "public"."equipment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_acquisition_method_id_acquisition_methods_id_fk" FOREIGN KEY ("acquisition_method_id") REFERENCES "public"."acquisition_methods"("id") ON DELETE no action ON UPDATE no action;