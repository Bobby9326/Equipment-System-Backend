ALTER TABLE "funds" ALTER COLUMN "fund_code" SET DATA TYPE char(4);--> statement-breakpoint
ALTER TABLE "funds" ALTER COLUMN "fund_code" SET NOT NULL;