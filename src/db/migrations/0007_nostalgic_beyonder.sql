CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity" varchar(50) NOT NULL,
	"entity_uuid" varchar(36) NOT NULL,
	"action" varchar(20) NOT NULL,
	"before" jsonb NOT NULL,
	"after" jsonb NOT NULL,
	"changed_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;