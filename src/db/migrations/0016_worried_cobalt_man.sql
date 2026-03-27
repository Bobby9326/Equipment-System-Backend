CREATE TABLE "mhesi_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"mhesi_id" integer NOT NULL,
	"attachment_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "floor" varchar(50);--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "warranty_years" integer;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "warranty_months" integer;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "warranty_end" date;--> statement-breakpoint
ALTER TABLE "mhesi_attachments" ADD CONSTRAINT "mhesi_attachments_mhesi_id_mhesi_numbers_id_fk" FOREIGN KEY ("mhesi_id") REFERENCES "public"."mhesi_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mhesi_attachments" ADD CONSTRAINT "mhesi_attachments_attachment_id_attachments_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("id") ON DELETE no action ON UPDATE no action;