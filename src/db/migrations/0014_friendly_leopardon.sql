ALTER TABLE "equipment" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "equipment_normals" ADD COLUMN "disbursed_to" varchar(255);--> statement-breakpoint
ALTER TABLE "equipment_normals" ADD COLUMN "disbursed_date" date;--> statement-breakpoint
ALTER TABLE "equipment_normals" ADD COLUMN "room_id" integer;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "receiving_mhesi_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "qty_ordered" integer;--> statement-breakpoint
ALTER TABLE "mhesi_numbers" ADD COLUMN "role" varchar(50);--> statement-breakpoint
ALTER TABLE "equipment_normals" ADD CONSTRAINT "equipment_normals_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_receiving_mhesi_id_mhesi_numbers_id_fk" FOREIGN KEY ("receiving_mhesi_id") REFERENCES "public"."mhesi_numbers"("id") ON DELETE no action ON UPDATE no action;