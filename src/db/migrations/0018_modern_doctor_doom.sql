ALTER TABLE "equipment_normals" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "equipment_status_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "equipment_unavailable" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_types" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "support_units" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "equipment_normals" CASCADE;--> statement-breakpoint
DROP TABLE "equipment_status_logs" CASCADE;--> statement-breakpoint
DROP TABLE "equipment_unavailable" CASCADE;--> statement-breakpoint
DROP TABLE "activities" CASCADE;--> statement-breakpoint
DROP TABLE "project_types" CASCADE;--> statement-breakpoint
DROP TABLE "support_units" CASCADE;--> statement-breakpoint
ALTER TABLE "equipment_disposals" DROP CONSTRAINT "equipment_disposals_equipment_id_equipment_id_fk";
--> statement-breakpoint
ALTER TABLE "equipment_disposals" DROP CONSTRAINT "equipment_disposals_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "uuid" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "equipment_code" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "equipment_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "equipment_number" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "equipment_type_id" integer;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "department_id" integer;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "fiscal_year" integer;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "price" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "acquisition_date" date;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "project_id" integer;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "disposed_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD COLUMN "disposed_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD CONSTRAINT "equipment_disposals_equipment_type_id_equipment_types_id_fk" FOREIGN KEY ("equipment_type_id") REFERENCES "public"."equipment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD CONSTRAINT "equipment_disposals_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD CONSTRAINT "equipment_disposals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD CONSTRAINT "equipment_disposals_disposed_by_users_id_fk" FOREIGN KEY ("disposed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_disposals" DROP COLUMN "equipment_id";--> statement-breakpoint
ALTER TABLE "equipment_disposals" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "equipment_disposals" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "equipment_disposals" ADD CONSTRAINT "equipment_disposals_uuid_unique" UNIQUE("uuid");