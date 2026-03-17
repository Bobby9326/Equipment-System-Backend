ALTER TABLE "projects" ADD COLUMN "project_number" varchar(10);--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_number_unique" UNIQUE("project_number");