import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  refType: varchar('ref_type', { length: 50 }).notNull(),
  refId: integer('ref_id').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});